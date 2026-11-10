package com.maiecouture.store.payment;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CyberSourceInitializeRequest(
        @NotNull Long orderId,
        @Valid BillingInformation billTo
) {
    public CyberSourceInitializeRequest(Long orderId) {
        this(orderId, null);
    }

    public record BillingInformation(
            @NotBlank @Size(max = 60) String firstName,
            @NotBlank @Size(max = 60) String lastName,
            @NotBlank @Size(max = 60) String address1,
            @Size(max = 60) String address2,
            @NotBlank @Size(max = 50) String locality,
            @NotBlank @Size(max = 50) String administrativeArea,
            @Size(max = 10) String postalCode,
            @NotBlank @Pattern(regexp = "[A-Z]{2}") String country,
            @NotBlank @Size(max = 20) String phoneNumber
    ) {}
}
