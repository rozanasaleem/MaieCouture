package com.maiecouture.store.payment;

import jakarta.validation.constraints.NotBlank;

public record CyberSourceCompleteRequest(
        @NotBlank String reference,
        @NotBlank String resultJwt
) {
}
