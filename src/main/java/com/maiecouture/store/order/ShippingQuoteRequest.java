package com.maiecouture.store.order;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ShippingQuoteRequest(
        String shippingCountryCode,
        @NotNull @DecimalMin("0.00") BigDecimal subtotalAmount,
        String currency
) {
}
