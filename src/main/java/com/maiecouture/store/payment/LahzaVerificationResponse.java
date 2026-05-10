package com.maiecouture.store.payment;

import com.maiecouture.store.order.OrderStatus;
import com.maiecouture.store.order.PaymentStatus;

public record LahzaVerificationResponse(
        String reference,
        PaymentStatus paymentStatus,
        OrderStatus orderStatus,
        boolean verified
) {
}
