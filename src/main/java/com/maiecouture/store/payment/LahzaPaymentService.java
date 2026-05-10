package com.maiecouture.store.payment;

import com.maiecouture.store.common.ResourceNotFoundException;
import com.maiecouture.store.config.LahzaProperties;
import com.maiecouture.store.notification.OrderNotificationService;
import com.maiecouture.store.order.Order;
import com.maiecouture.store.order.OrderRepository;
import com.maiecouture.store.order.OrderStatus;
import com.maiecouture.store.order.PaymentStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

@Service
@Transactional
public class LahzaPaymentService {

    private static final String PROVIDER = "LAHZA";

    private final OrderRepository orderRepository;
    private final LahzaProperties lahzaProperties;
    private final OrderNotificationService orderNotificationService;
    private final RestClient restClient;

    public LahzaPaymentService(
            OrderRepository orderRepository,
            LahzaProperties lahzaProperties,
            OrderNotificationService orderNotificationService
    ) {
        this.orderRepository = orderRepository;
        this.lahzaProperties = lahzaProperties;
        this.orderNotificationService = orderNotificationService;
        this.restClient = RestClient.builder().build();
    }

    public LahzaInitializeResponse initialize(LahzaInitializeRequest request) {
        Order order = orderRepository.findById(request.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + request.orderId()));

        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new IllegalArgumentException("Order is already paid");
        }

        String reference = "MC-LAHZA-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();
        String checkoutUrl;
        String safeReturnUrl = (request.returnUrl() == null || request.returnUrl().isBlank())
                ? "http://localhost:3000/checkout/success"
                : request.returnUrl();
        String safeCancelUrl = (request.cancelUrl() == null || request.cancelUrl().isBlank())
                ? "http://localhost:3000/checkout/failure"
                : request.cancelUrl();

        if (lahzaProperties.enabled()) {
            ensureLahzaCredentials();
            Map<String, Object> result = initializeRemote(order, reference, safeReturnUrl, safeCancelUrl);
            checkoutUrl = Optional.ofNullable(result.get("checkoutUrl"))
                    .map(Object::toString)
                    .orElseThrow(() -> new IllegalStateException("Lahza response missing checkout URL"));
            reference = Optional.ofNullable(result.get("reference"))
                    .map(Object::toString)
                    .orElse(reference);
        } else {
            checkoutUrl = safeReturnUrl + "?reference=" + reference + "&mock=true";
        }

        order.setPaymentProvider(PROVIDER);
        order.setPaymentReference(reference);
        order.setPaymentSessionId(reference);
        order.touch();
        orderRepository.save(order);

        return new LahzaInitializeResponse(
                order.getId(),
                order.getOrderNumber(),
                reference,
                checkoutUrl,
                order.getPaymentStatus()
        );
    }

    public LahzaVerificationResponse verifyByReference(String reference) {
        Order order = findOrderByReference(reference);
        boolean verified = verifyAndApplyPayment(order, null, null);
        return new LahzaVerificationResponse(order.getPaymentReference(), order.getPaymentStatus(), order.getOrderStatus(), verified);
    }

    public LahzaVerificationResponse handleCallback(LahzaCallbackRequest request) {
        if (request.reference() == null || request.reference().isBlank()) {
            throw new IllegalArgumentException("Callback reference is required");
        }

        Order order = findOrderByReference(request.reference());
        boolean verified = verifyAndApplyPayment(order, request.status(), request.transactionId());
        return new LahzaVerificationResponse(order.getPaymentReference(), order.getPaymentStatus(), order.getOrderStatus(), verified);
    }

    private Order findOrderByReference(String reference) {
        return orderRepository.findByPaymentReference(reference)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found for payment reference: " + reference));
    }

    private boolean verifyAndApplyPayment(Order order, String callbackStatus, String callbackTransactionId) {
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            return true;
        }

        PaymentStatus previousPaymentStatus = order.getPaymentStatus();
        boolean paid;
        if (lahzaProperties.enabled()) {
            paid = verifyRemotePayment(order.getPaymentReference());
        } else {
            paid = isPaidStatus(callbackStatus) || callbackStatus == null;
        }

        if (paid) {
            order.setPaymentStatus(PaymentStatus.PAID);
            order.setOrderStatus(OrderStatus.PROCESSING);
            order.setPaymentVerifiedAt(Instant.now());
            if (callbackTransactionId != null && !callbackTransactionId.isBlank()) {
                order.setPaymentSessionId(callbackTransactionId);
            }
        } else if (isFailedStatus(callbackStatus)) {
            order.setPaymentStatus(PaymentStatus.FAILED);
            order.setOrderStatus(OrderStatus.CANCELLED);
        } else {
            order.setPaymentStatus(PaymentStatus.PENDING);
        }
        order.touch();
        Order saved = orderRepository.save(order);
        if (previousPaymentStatus != PaymentStatus.PAID && saved.getPaymentStatus() == PaymentStatus.PAID) {
            orderNotificationService.sendPaymentConfirmed(saved);
        }
        return paid;
    }

    private Map<String, Object> initializeRemote(Order order, String reference, String returnUrl, String cancelUrl) {
        String amountInMinorUnit = toMinorUnitAmount(order.getTotalAmount());
        String lahzaCurrency = toLahzaCurrency(order.getCurrency());
        Map<String, Object> payload = Map.of(
                "amount", amountInMinorUnit,
                "currency", lahzaCurrency,
                "email", order.getEmail(),
                "reference", reference,
                "callback_url", lahzaProperties.callbackUrl(),
                "return_url", returnUrl,
                "cancel_url", cancelUrl,
                "metadata", Map.of(
                        "order_id", order.getId(),
                        "order_number", order.getOrderNumber()
                )
        );

        Map<String, Object> response = restClient.post()
                .uri(lahzaProperties.baseUrl() + "/transaction/initialize")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + lahzaProperties.secretKey())
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .body(Map.class);

        if (response == null) {
            throw new IllegalStateException("Empty response from Lahza initialize");
        }

        Map<String, Object> data = (Map<String, Object>) response.get("data");
        if (data == null) {
            throw new IllegalStateException("Invalid Lahza initialize response payload");
        }

        return Map.of(
                "reference", data.getOrDefault("reference", reference),
                "checkoutUrl", data.get("authorization_url")
        );
    }

    private boolean verifyRemotePayment(String reference) {
        ensureLahzaCredentials();
        Map<String, Object> response = restClient.get()
                .uri(lahzaProperties.baseUrl() + "/transaction/verify/" + reference)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + lahzaProperties.secretKey())
                .retrieve()
                .body(Map.class);

        if (response == null) {
            return false;
        }
        Map<String, Object> data = (Map<String, Object>) response.get("data");
        if (data == null || data.get("status") == null) {
            return false;
        }
        String status = data.get("status").toString();
        return isPaidStatus(status);
    }

    private boolean isPaidStatus(String status) {
        if (status == null) {
            return false;
        }
        return status.equalsIgnoreCase("success")
                || status.equalsIgnoreCase("successful")
                || status.equalsIgnoreCase("paid");
    }

    private boolean isFailedStatus(String status) {
        if (status == null) {
            return false;
        }
        return status.equalsIgnoreCase("failed")
                || status.equalsIgnoreCase("cancelled")
                || status.equalsIgnoreCase("canceled")
                || status.equalsIgnoreCase("abandoned");
    }

    private void ensureLahzaCredentials() {
        if (lahzaProperties.secretKey() == null || lahzaProperties.secretKey().isBlank()) {
            throw new IllegalStateException("LAHZA_SECRET_KEY is required when Lahza is enabled");
        }
    }

    private String toMinorUnitAmount(BigDecimal amount) {
        if (amount == null) {
            return "0";
        }
        return amount
                .setScale(2, RoundingMode.HALF_UP)
                .movePointRight(2)
                .setScale(0, RoundingMode.HALF_UP)
                .toPlainString();
    }

    private String toLahzaCurrency(String currency) {
        return "ILS";
    }
}
