package com.maiecouture.store.payment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.maiecouture.store.config.CyberSourceProperties;
import com.maiecouture.store.notification.OrderNotificationService;
import com.maiecouture.store.order.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CyberSourcePaymentServiceTest {
    private final OrderRepository repository = mock(OrderRepository.class);
    private final OrderNotificationService notifications = mock(OrderNotificationService.class);
    private final CyberSourceResultVerifier verifier = mock(CyberSourceResultVerifier.class);
    private final ObjectMapper mapper = new ObjectMapper();
    private Order order;
    private CyberSourcePaymentService service;

    static CyberSourceProperties properties(boolean enabled) {
        return new CyberSourceProperties(enabled, "https://apitest.cybersource.com", "test-merchant", "test-key", "c2VjcmV0",
                List.of("https://localhost:3000"), null, List.of("VISA"), List.of("PANENTRY"), "US", "en_US", "CAPTURE", false, null);
    }

    @BeforeEach
    void setup() {
        service = new CyberSourcePaymentService(repository, properties(true), notifications, mapper, verifier);
        order = new Order();
        order.setPaymentProvider("CYBERSOURCE");
        order.setEmail("sandbox@example.com");
        order.setPaymentReference("ref-one");
        order.setPaymentSessionId("capture-session");
        order.setCurrency("ILS");
        order.setTotalAmount(new BigDecimal("100.00"));
        when(repository.findByPaymentReference("ref-one")).thenReturn(Optional.of(order));
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private void result(String status, String reference, String amount, String currency) throws Exception {
        when(verifier.verify("token")).thenReturn(mapper.readTree("""
                {"metadata":{"ccJti":"capture-session"},"status":"%s","details":{"clientReferenceInformation":{"code":"%s"},
                "orderInformation":{"amountDetails":{"totalAmount":"%s","currency":"%s"}},
                "unrelatedNote":"SUCCESS"}}
                """.formatted(status, reference, amount, currency)));
    }

    @Test void rejectsUnverifiedTokensWithoutSaving() {
        when(verifier.verify("token")).thenThrow(new IllegalArgumentException("Invalid signature"));
        assertThrows(IllegalArgumentException.class, () -> service.complete(new CyberSourceCompleteRequest("ref-one", "token")));
        verify(repository, never()).save(any());
        assertEquals(PaymentStatus.PENDING, order.getPaymentStatus());
    }

    @Test void rejectsOtherOrderResult() throws Exception {
        result("COMPLETED", "another-order", "100.00", "ILS");
        assertThrows(IllegalArgumentException.class, () -> service.complete(new CyberSourceCompleteRequest("ref-one", "token")));
        verify(repository, never()).save(any());
    }

    @Test void rejectsIncorrectAmount() throws Exception {
        result("COMPLETED", "ref-one", "1.00", "ILS");
        assertThrows(IllegalArgumentException.class, () -> service.complete(new CyberSourceCompleteRequest("ref-one", "token")));
    }

    @Test void rejectsIncorrectCurrency() throws Exception {
        result("COMPLETED", "ref-one", "100.00", "USD");
        assertThrows(IllegalArgumentException.class, () -> service.complete(new CyberSourceCompleteRequest("ref-one", "token")));
    }

    @Test void authorizedAmountInReviewResultRemainsPending() throws Exception {
        when(verifier.verify("token")).thenReturn(mapper.readTree("""
                {"metadata":{"ccJti":"capture-session"},"status":"COMPLETED","outcome":"AUTHORIZED_PENDING_REVIEW",
                 "details":{"clientReferenceInformation":{"code":"ref-one"},
                 "orderInformation":{"amountDetails":{"authorizedAmount":"100.00","currency":"ILS"}}}}
                """));
        var result = service.complete(new CyberSourceCompleteRequest("ref-one", "token"));
        assertEquals(PaymentStatus.PENDING, result.paymentStatus());
        assertFalse(result.verified());
        verifyNoInteractions(notifications);
    }

    @Test void authorizationOutcomeDoesNotPayEvenWhenCompletionStatusIsCompleted() throws Exception {
        result("COMPLETED", "ref-one", "100.00", "ILS");
        var payload = (com.fasterxml.jackson.databind.node.ObjectNode) verifier.verify("token");
        payload.put("outcome", "AUTHORIZED");
        assertFalse(service.complete(new CyberSourceCompleteRequest("ref-one", "token")).verified());
        verifyNoInteractions(notifications);
    }

    @Test void mismatchedAuthorizedAmountCannotBeHiddenByMatchingTotal() throws Exception {
        result("COMPLETED", "ref-one", "100.00", "ILS");
        var amounts = (com.fasterxml.jackson.databind.node.ObjectNode) verifier.verify("token")
                .path("details").path("orderInformation").path("amountDetails");
        amounts.put("authorizedAmount", "1.00");
        assertThrows(IllegalArgumentException.class, () -> service.complete(new CyberSourceCompleteRequest("ref-one", "token")));
        verify(repository, never()).save(any());
    }

    @Test void completedMatchingResultPaysAndNotifiesOnce() throws Exception {
        result("COMPLETED", "ref-one", "100.00", "ILS");
        service.complete(new CyberSourceCompleteRequest("ref-one", "token"));
        service.complete(new CyberSourceCompleteRequest("ref-one", "token"));
        assertEquals(PaymentStatus.PAID, order.getPaymentStatus());
        verify(notifications, times(1)).sendPaymentConfirmed(order);
    }

    @Test void authenticationOrUnrelatedSuccessDoesNotMeanPaid() throws Exception {
        result("AUTHENTICATED", "ref-one", "100.00", "ILS");
        service.complete(new CyberSourceCompleteRequest("ref-one", "token"));
        assertEquals(PaymentStatus.PENDING, order.getPaymentStatus());
        verifyNoInteractions(notifications);
    }

    @Test void declinedPaymentFails() throws Exception {
        result("DECLINED", "ref-one", "100.00", "ILS");
        service.complete(new CyberSourceCompleteRequest("ref-one", "token"));
        assertEquals(PaymentStatus.FAILED, order.getPaymentStatus());
    }

    @Test void paidOrderCannotBeDowngraded() throws Exception {
        order.setPaymentStatus(PaymentStatus.PAID);
        result("DECLINED", "ref-one", "100.00", "ILS");
        service.complete(new CyberSourceCompleteRequest("ref-one", "token"));
        assertEquals(PaymentStatus.PAID, order.getPaymentStatus());
        verify(repository, never()).save(any());
    }

    @Test void disabledGatewayCannotCompletePayment() {
        service = new CyberSourcePaymentService(repository, properties(false), notifications, mapper, verifier);
        assertThrows(IllegalStateException.class, () -> service.complete(new CyberSourceCompleteRequest("ref-one", "token")));
        verifyNoInteractions(repository);
    }

    @Test void repeatedInitializationKeepsExistingReference() {
        service = new CyberSourcePaymentService(repository, properties(false), notifications, mapper, verifier);
        when(repository.findById(34L)).thenReturn(Optional.of(order));
        var first = service.initialize(new CyberSourceInitializeRequest(34L));
        var second = service.initialize(new CyberSourceInitializeRequest(34L));
        assertEquals("ref-one", first.reference());
        assertEquals(first.reference(), second.reference());
    }

    @Test void rejectsResultFromAnotherCheckoutSession() throws Exception {
        result("COMPLETED", "ref-one", "100.00", "ILS");
        order.setPaymentSessionId("different-session");
        assertThrows(IllegalArgumentException.class, () -> service.complete(new CyberSourceCompleteRequest("ref-one", "token")));
        verify(repository, never()).save(any());
    }

    @Test void processorValidationErrorDoesNotRequireSuccessFields() throws Exception {
        when(verifier.verify("token")).thenReturn(mapper.readTree("""
                {"metadata":{"ccJti":"capture-session"},"status":"INVALID_REQUEST",
                 "details":{"reason":"MISSING_FIELD"}}
                """));
        service.complete(new CyberSourceCompleteRequest("ref-one", "token"));
        assertEquals(PaymentStatus.FAILED, order.getPaymentStatus());
        verifyNoInteractions(notifications);
    }

    @Test void initializeVerifiesContextAndReturnsPerSessionIntegrity() throws Exception {
        var builder = org.springframework.web.client.RestClient.builder();
        var server = org.springframework.test.web.client.MockRestServiceServer.bindTo(builder).build();
        service = new CyberSourcePaymentService(repository, properties(true), notifications, mapper, verifier, builder);
        when(repository.findById(34L)).thenReturn(Optional.of(order));
        when(verifier.verify("signed.capture.context")).thenReturn(mapper.readTree("""
                {"jti":"verified-context","ctx":[{"data":{"clientLibrary":"https://testup.cybersource.com/session/UnifiedCheckout.js","clientLibraryIntegrity":"sha384-session-specific"}}]}
                """));
        server.expect(org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo("https://apitest.cybersource.com/uc/v1/sessions"))
                .andExpect(org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath("$.data.orderInformation.billTo.email").value("sandbox@example.com"))
                .andRespond(org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess("signed.capture.context", org.springframework.http.MediaType.TEXT_PLAIN));
        var result = service.initialize(new CyberSourceInitializeRequest(34L));
        assertEquals("sha384-session-specific", result.clientLibraryIntegrity());
        assertEquals("verified-context", order.getPaymentSessionId());
        verify(verifier).verify("signed.capture.context");
        server.verify();
    }

    @Test void missingContextIntegrityIsRejected() throws Exception {
        var builder = org.springframework.web.client.RestClient.builder();
        var server = org.springframework.test.web.client.MockRestServiceServer.bindTo(builder).build();
        service = new CyberSourcePaymentService(repository, properties(true), notifications, mapper, verifier, builder);
        when(repository.findById(34L)).thenReturn(Optional.of(order));
        when(verifier.verify("signed.capture.context")).thenReturn(mapper.readTree("{\"jti\":\"context\",\"clientLibrary\":\"https://testup.cybersource.com/library.js\"}"));
        server.expect(org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo("https://apitest.cybersource.com/uc/v1/sessions"))
                .andRespond(org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess("signed.capture.context", org.springframework.http.MediaType.TEXT_PLAIN));
        assertThrows(IllegalStateException.class, () -> service.initialize(new CyberSourceInitializeRequest(34L)));
    }

    @Test void successPageStatusReadCannotMarkPendingOrderPaid() {
        assertFalse(service.status("ref-one").verified());
        assertEquals(PaymentStatus.PENDING, order.getPaymentStatus());
        verify(repository, never()).save(any());
    }
}
