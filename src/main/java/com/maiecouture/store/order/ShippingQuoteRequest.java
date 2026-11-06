package com.maiecouture.store.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.List;

public record ShippingQuoteRequest(
        String shippingCountryCode,
        String shippingAreaCode,
        @NotNull @DecimalMin("0.00") BigDecimal subtotalAmount,
        String currency,
        List<@Valid ShippingLineRequest> items
) {
    public record ShippingLineRequest(
            @NotNull Long productId,
            @NotNull @Positive Integer quantity
    ) {
    }
}
