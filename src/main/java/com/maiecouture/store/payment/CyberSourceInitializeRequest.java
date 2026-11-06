package com.maiecouture.store.payment;

import jakarta.validation.constraints.NotNull;

public record CyberSourceInitializeRequest(
        @NotNull Long orderId
) {
}
