package com.maiecouture.store.payment;

import jakarta.validation.constraints.NotNull;

public record LahzaInitializeRequest(
        @NotNull Long orderId,
        String returnUrl,
        String cancelUrl
) {
}
