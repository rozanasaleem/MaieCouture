package com.maiecouture.store.payment;

import com.maiecouture.store.order.OrderStatus;
import com.maiecouture.store.order.PaymentStatus;

public record CyberSourceCompleteResponse(
        String reference,
        PaymentStatus paymentStatus,
        OrderStatus orderStatus,
        boolean verified
) {
}
