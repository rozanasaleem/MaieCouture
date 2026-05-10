package com.maiecouture.store.payment;

import com.maiecouture.store.order.PaymentStatus;

public record LahzaInitializeResponse(
        Long orderId,
        String orderNumber,
        String reference,
        String checkoutUrl,
        PaymentStatus paymentStatus
) {
}
