package com.maiecouture.store.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;

public record CreateOrderRequest(
        @NotBlank String customerName,
        @NotBlank @Email String email,
        String phone,
        @NotBlank String shippingAddress,
        String shippingCountryCode,
        String notes,
        @NotEmpty List<@Valid OrderLineRequest> items
) {
    public record OrderLineRequest(
            @NotNull Long productId,
            Long variantId,
            @NotNull @Positive Integer quantity
    ) {
    }
}
