package com.maiecouture.store.product;

import java.math.BigDecimal;

public record PriceAdjustmentResponse(
        int updatedProducts,
        BigDecimal percentage,
        boolean includeSalePrice,
        PurchaseType purchaseType
) {
}
