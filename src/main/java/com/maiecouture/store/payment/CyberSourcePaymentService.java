package com.maiecouture.store.payment;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.maiecouture.store.config.CyberSourceProperties;
import com.maiecouture.store.notification.OrderNotificationService;
import com.maiecouture.store.order.Order;
import com.maiecouture.store.order.OrderRepository;
import com.maiecouture.store.order.OrderStatus;
import com.maiecouture.store.order.PaymentStatus;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

@Service
public class CyberSourcePaymentService {

    private static final String CAPTURE_CONTEXT_PATH = "/uc/v1/sessions";
    private static final String PROVIDER = "CYBERSOURCE";
    private static final DateTimeFormatter HTTP_DATE = DateTimeFormatter.RFC_1123_DATE_TIME;

    private final OrderRepository orderRepository;
    private final CyberSourceProperties properties;
    private final OrderNotificationService orderNotificationService;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;
    private final CyberSourceResultVerifier resultVerifier;
    private CyberSourceEvidenceStore evidenceStore;

    @org.springframework.beans.factory.annotation.Autowired
    void setEvidenceStore(CyberSourceEvidenceStore evidenceStore) {
        this.evidenceStore = evidenceStore;
    }

    @org.springframework.beans.factory.annotation.Autowired
    public CyberSourcePaymentService(
            OrderRepository orderRepository,
            CyberSourceProperties properties,
            OrderNotificationService orderNotificationService,
            ObjectMapper objectMapper,
            CyberSourceResultVerifier resultVerifier
    ) {
        this(orderRepository, properties, orderNotificationService, objectMapper, resultVerifier, RestClient.builder());
    }

    CyberSourcePaymentService(OrderRepository orderRepository, CyberSourceProperties properties,
            OrderNotificationService orderNotificationService, ObjectMapper objectMapper,
            CyberSourceResultVerifier resultVerifier, RestClient.Builder builder) {
        this.orderRepository = orderRepository;
        this.properties = properties;
        this.orderNotificationService = orderNotificationService;
        this.objectMapper = objectMapper;
        this.resultVerifier = resultVerifier;
        this.restClient = builder
                .baseUrl(baseUrl())
                .build();
    }

    public CyberSourceInitializeResponse initialize(CyberSourceInitializeRequest request) {
        Order order = orderRepository.findById(request.orderId())
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new IllegalStateException("Order is already paid");
        }

        String reference = PROVIDER.equals(order.getPaymentProvider()) && StringUtils.hasText(order.getPaymentReference())
                ? order.getPaymentReference() : createReference();
        order.setPaymentProvider(PROVIDER);
        order.setPaymentReference(reference);
        order.setPaymentSessionId(null);
        order.touch();
        orderRepository.save(order);

        if (!properties.enabled()) {
            return new CyberSourceInitializeResponse(
                    order.getId(),
                    order.getOrderNumber(),
                    reference,
                    null,
                    null,
                    null,
                    order.getPaymentStatus(),
                    true
            );
        }

        ensureConfigured();

        String requestBody = toJson(captureContextPayload(order));
        var response = postCaptureContext(requestBody);
        if (evidenceStore != null) {
            evidenceStore.record(order.getId(), reference, baseUrl() + CAPTURE_CONTEXT_PATH,
                    requestBody, response.getStatusCode().value(), response.getBody());
        }
        CaptureContextDetails captureContext = captureContextDetails(response.getBody());

        String contextId = captureContext.contextId();
        if (!StringUtils.hasText(contextId)) {
            throw new IllegalStateException("CyberSource capture context is missing its session ID");
        }
        order.setPaymentSessionId(contextId);
        order.touch();
        orderRepository.save(order);

        return new CyberSourceInitializeResponse(
                order.getId(),
                order.getOrderNumber(),
                reference,
                captureContext.jwt(),
                captureContext.clientLibrary(),
                captureContext.clientLibraryIntegrity(),
                order.getPaymentStatus(),
                false
        );
    }

    public CyberSourceCompleteResponse complete(CyberSourceCompleteRequest request) {
        if (!properties.enabled()) {
            throw new IllegalStateException("CyberSource is disabled; payment cannot be verified");
        }
        ensureConfigured();
        Order order = orderRepository.findByPaymentReference(request.reference())
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!StringUtils.hasText(request.resultJwt())) {
            throw new IllegalArgumentException("CyberSource payment result is required");
        }

        if (!PROVIDER.equals(order.getPaymentProvider())) {
            throw new IllegalArgumentException("Order does not belong to CyberSource");
        }
        JsonNode payload = resultVerifier.verify(request.resultJwt());
        if (!StringUtils.hasText(order.getPaymentSessionId())
                || !order.getPaymentSessionId().equals(payload.path("metadata").path("ccJti").asText())) {
            throw new IllegalArgumentException("CyberSource result does not match the checkout session");
        }
        if (evidenceStore != null) evidenceStore.recordCompletion(request.reference(), request.resultJwt());
        JsonNode resultNode = payload.path("data").path("completeResponse");
        if (resultNode.isMissingNode()) resultNode = payload.path("completeResponse");
        if (resultNode.isMissingNode()) resultNode = payload.path("transactionResult");
        if (resultNode.isMissingNode()) resultNode = payload;
        JsonNode details = resultNode.path("details");
        String status = normalizePaymentSignal(resultNode.path("status").asText());
        String outcome = normalizePaymentSignal(resultNode.path("outcome").asText());
        if (isFailedPaymentSignal(outcome) || outcome.contains("REVIEW")
                || outcome.equals("AUTHORIZED") || outcome.equals("PENDING")) status = outcome;
        boolean failed = isFailedPaymentSignal(status);
        if (!failed) {
            if (!request.reference().equals(details.path("clientReferenceInformation").path("code").asText())) {
                throw new IllegalArgumentException("CyberSource result does not match this order");
            }
            JsonNode amount = details.path("orderInformation").path("amountDetails");
            try {
                String paymentAmount = firstText(amount, "totalAmount", "authorizedAmount");
                if (new java.math.BigDecimal(paymentAmount == null ? "" : paymentAmount).compareTo(order.getTotalAmount()) != 0
                        || !providerCurrency(order.getCurrency()).equals(amount.path("currency").asText())) {
                    throw new IllegalArgumentException("CyberSource payment amount or currency does not match");
                }
                if (amount.hasNonNull("authorizedAmount")
                        && new java.math.BigDecimal(amount.path("authorizedAmount").asText()).compareTo(order.getTotalAmount()) != 0) {
                    throw new IllegalArgumentException("CyberSource authorized amount does not match");
                }
            } catch (NumberFormatException exception) {
                throw new IllegalArgumentException("CyberSource payment amount is missing or invalid", exception);
            }
        }
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            return new CyberSourceCompleteResponse(order.getPaymentReference(), order.getPaymentStatus(), order.getOrderStatus(), true);
        }
        PaymentStatus previousPaymentStatus = order.getPaymentStatus();
        CyberSourceResult result = new CyberSourceResult(
                status.equals("CAPTURED") || status.equals("COMPLETED"), failed);

        order.setPaymentProvider(PROVIDER);

        if (result.approved()) {
            order.setPaymentStatus(PaymentStatus.PAID);
            order.setOrderStatus(OrderStatus.PROCESSING);
            order.setPaymentVerifiedAt(Instant.now());
        } else if (result.failed()) {
            order.setPaymentStatus(PaymentStatus.FAILED);
            order.setOrderStatus(OrderStatus.CANCELLED);
        } else {
            order.setPaymentStatus(PaymentStatus.PENDING);
            order.setOrderStatus(OrderStatus.PENDING);
        }

        order.touch();
        Order saved = orderRepository.save(order);
        if (previousPaymentStatus != PaymentStatus.PAID && saved.getPaymentStatus() == PaymentStatus.PAID) {
            orderNotificationService.sendPaymentConfirmed(saved);
        }

        return new CyberSourceCompleteResponse(
                saved.getPaymentReference(),
                saved.getPaymentStatus(),
                saved.getOrderStatus(),
                saved.getPaymentStatus() == PaymentStatus.PAID
        );
    }

    public CyberSourceCompleteResponse status(String reference) {
        Order order = orderRepository.findByPaymentReference(reference)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        if (!PROVIDER.equals(order.getPaymentProvider())) {
            throw new IllegalArgumentException("Order does not belong to CyberSource");
        }
        return new CyberSourceCompleteResponse(reference, order.getPaymentStatus(), order.getOrderStatus(),
                order.getPaymentStatus() == PaymentStatus.PAID);
    }

    private Map<String, Object> captureContextPayload(Order order) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("targetOrigins", nonEmpty(properties.targetOrigins(), List.of("https://localhost:3000")));
        if (StringUtils.hasText(properties.clientVersion())) {
            payload.put("clientVersion", properties.clientVersion().trim());
        }
        payload.put("allowedCardNetworks", nonEmpty(properties.allowedCardNetworks(), List.of("VISA", "MASTERCARD")));
        payload.put("allowedPaymentTypes", nonEmpty(properties.allowedPaymentTypes(), List.of("PANENTRY")));
        payload.put("country", textOr(properties.country(), "US"));
        payload.put("locale", textOr(properties.locale(), "en_US"));
        payload.put("buttonType", "CHECKOUT");

        Map<String, Object> captureMandate = new LinkedHashMap<>();
        captureMandate.put("billingType", "FULL");
        captureMandate.put("requestEmail", false);
        captureMandate.put("requestPhone", false);
        captureMandate.put("requestShipping", false);
        captureMandate.put("showConfirmationStep", false);
        payload.put("captureMandate", captureMandate);

        Map<String, Object> completeMandate = new LinkedHashMap<>();
        completeMandate.put("type", textOr(properties.completeType(), "CAPTURE"));
        if (properties.decisionManagerEnabled()) {
            completeMandate.put("decisionManager", true);
        }
        if (StringUtils.hasText(properties.consumerAuthentication())) {
            completeMandate.put("consumerAuthentication", properties.consumerAuthentication());
        }
        payload.put("completeMandate", completeMandate);

        Map<String, Object> amountDetails = new LinkedHashMap<>();
        amountDetails.put("totalAmount", order.getTotalAmount().setScale(2, RoundingMode.HALF_UP).toPlainString());
        amountDetails.put("currency", providerCurrency(order.getCurrency()));

        Map<String, Object> orderInformation = new LinkedHashMap<>();
        orderInformation.put("amountDetails", amountDetails);
        orderInformation.put("billTo", Map.of("email", order.getEmail()));

        Map<String, Object> clientReferenceInformation = new LinkedHashMap<>();
        clientReferenceInformation.put("code", order.getPaymentReference());

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("orderInformation", orderInformation);
        data.put("clientReferenceInformation", clientReferenceInformation);
        payload.put("data", data);

        return payload;
    }

    private org.springframework.http.ResponseEntity<String> postCaptureContext(String requestBody) {
        String host = host();
        String date = HTTP_DATE.format(ZonedDateTime.now(ZoneOffset.UTC));
        String digest = digest(requestBody);
        String signature = signature(host, date, digest);

        return restClient.post()
                .uri(CAPTURE_CONTEXT_PATH)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Host", host)
                .header("Date", date)
                .header("Digest", digest)
                .header("v-c-merchant-id", properties.merchantId())
                .header("Signature", signature)
                .body(requestBody)
                .retrieve()
                .toEntity(String.class);
    }

    private String signature(String host, String date, String digest) {
        String signingString = "host: " + host + "\n"
                + "date: " + date + "\n"
                + "request-target: post " + CAPTURE_CONTEXT_PATH + "\n"
                + "digest: " + digest + "\n"
                + "v-c-merchant-id: " + properties.merchantId();

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            byte[] secret = Base64.getDecoder().decode(properties.secretKey().trim());
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            String encodedSignature = Base64.getEncoder()
                    .encodeToString(mac.doFinal(signingString.getBytes(StandardCharsets.UTF_8)));

            return "keyid=\"" + properties.keyId().trim() + "\", "
                    + "algorithm=\"HmacSHA256\", "
                    + "headers=\"host date request-target digest v-c-merchant-id\", "
                    + "signature=\"" + encodedSignature + "\"";
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to sign CyberSource request", exception);
        }
    }

    private String digest(String requestBody) {
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            byte[] hash = messageDigest.digest(requestBody.getBytes(StandardCharsets.UTF_8));
            return "SHA-256=" + Base64.getEncoder().encodeToString(hash);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to create CyberSource digest", exception);
        }
    }

    private CaptureContextDetails captureContextDetails(String responseBody) {
        if (!StringUtils.hasText(responseBody)) {
            throw new IllegalStateException("CyberSource did not return a capture context");
        }

        String trimmed = responseBody.trim();
        String jwt = trimmed;

        try {
            if (trimmed.startsWith("\"")) {
                jwt = objectMapper.readValue(trimmed, String.class);
            } else if (trimmed.startsWith("{")) {
                JsonNode root = objectMapper.readTree(trimmed);
                jwt = firstText(root, "captureContext", "jwt", "token");
            }
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to parse CyberSource capture context", exception);
        }

        if (!StringUtils.hasText(jwt) || jwt.split("\\.").length < 2) {
            throw new IllegalStateException("CyberSource response did not include a usable capture context JWT");
        }

        JsonNode payload = resultVerifier.verify(jwt.trim());
        String library = findText(payload, "clientLibrary");
        String integrity = findText(payload, "clientLibraryIntegrity");
        if (!StringUtils.hasText(library) || !StringUtils.hasText(integrity)) {
            throw new IllegalStateException("CyberSource capture context is missing its script URL or integrity value");
        }
        return new CaptureContextDetails(jwt.trim(), library, integrity, payload.path("jti").asText());
    }

    private boolean isFailedPaymentSignal(String value) {
        String normalized = normalizePaymentSignal(value);
        return normalized.equals("DECLINE")
                || normalized.equals("INVALID_REQUEST")
                || normalized.equals("DECLINED")
                || normalized.equals("REJECT")
                || normalized.equals("REJECTED")
                || normalized.equals("FAILED")
                || normalized.equals("FAILURE")
                || normalized.equals("ERROR")
                || normalized.equals("CANCEL")
                || normalized.equals("CANCELLED")
                || normalized.equals("CANCELED")
                || normalized.equals("TRANSACTION_FAILED");
    }

    private String normalizePaymentSignal(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
    }

    private String firstText(JsonNode root, String... fieldNames) {
        for (String fieldName : fieldNames) {
            String value = findText(root, fieldName);
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return null;
    }

    private String findText(JsonNode node, String fieldName) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isObject()) {
            JsonNode direct = node.get(fieldName);
            if (direct != null && direct.isTextual()) {
                return direct.asText();
            }
            for (JsonNode child : node) {
                String value = findText(child, fieldName);
                if (StringUtils.hasText(value)) {
                    return value;
                }
            }
        }
        if (node.isArray()) {
            for (JsonNode child : node) {
                String value = findText(child, fieldName);
                if (StringUtils.hasText(value)) {
                    return value;
                }
            }
        }
        return null;
    }

    private String toJson(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to create CyberSource request body", exception);
        }
    }

    private void ensureConfigured() {
        if (!StringUtils.hasText(properties.merchantId())) {
            throw new IllegalStateException("CYBERSOURCE_MERCHANT_ID is required when CyberSource is enabled");
        }
        if (!StringUtils.hasText(properties.keyId())) {
            throw new IllegalStateException("CYBERSOURCE_KEY_ID is required when CyberSource is enabled");
        }
        if (!StringUtils.hasText(properties.secretKey())) {
            throw new IllegalStateException("CYBERSOURCE_SECRET_KEY is required when CyberSource is enabled");
        }
    }

    private String createReference() {
        return "MC-CYBS-" + UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 10)
                .toUpperCase(Locale.ROOT);
    }

    private String providerCurrency(String currency) {
        if ("NIS".equalsIgnoreCase(currency) || "ILS".equalsIgnoreCase(currency)) {
            return "ILS";
        }
        return currency.toUpperCase(Locale.ROOT);
    }

    private String host() {
        return baseUrl()
                .replace("https://", "")
                .replace("http://", "")
                .replaceAll("/$", "");
    }

    private String baseUrl() {
        return textOr(properties.baseUrl(), "https://apitest.cybersource.com");
    }

    private static String textOr(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }

    private static <T> List<T> nonEmpty(List<T> values, List<T> fallback) {
        return values == null || values.isEmpty() ? fallback : values;
    }

    private record CaptureContextDetails(String jwt, String clientLibrary, String clientLibraryIntegrity, String contextId) {
    }

    private record CyberSourceResult(boolean approved, boolean failed) {
    }
}
