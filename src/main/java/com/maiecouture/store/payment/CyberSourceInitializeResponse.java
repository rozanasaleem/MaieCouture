package com.maiecouture.store.payment;

import com.maiecouture.store.order.PaymentStatus;

public record CyberSourceInitializeResponse(
        Long orderId,
        String orderNumber,
        String reference,
        String captureContext,
        String clientLibrary,
        String clientLibraryIntegrity,
        PaymentStatus paymentStatus,
        boolean mock
) {
}
