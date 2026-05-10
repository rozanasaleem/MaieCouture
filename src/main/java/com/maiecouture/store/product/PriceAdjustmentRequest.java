package com.maiecouture.store.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PriceAdjustmentRequest(
        @NotNull @DecimalMin(value = "-99.99") BigDecimal percentage,
        boolean includeSalePrice,
        PurchaseType purchaseType
) {
}
