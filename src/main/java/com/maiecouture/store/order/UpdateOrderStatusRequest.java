package com.maiecouture.store.order;

import jakarta.validation.constraints.NotNull;

public record UpdateOrderStatusRequest(
        @NotNull OrderStatus orderStatus,
        PaymentStatus paymentStatus
) {
}
