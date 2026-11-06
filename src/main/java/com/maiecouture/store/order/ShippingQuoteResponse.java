package com.maiecouture.store.order;

import java.math.BigDecimal;

public record ShippingQuoteResponse(
        String shippingCountryCode,
        String shippingAreaCode,
        BigDecimal subtotalAmount,
        BigDecimal shippingFee,
        BigDecimal totalAmount,
        String currency
) {
}
