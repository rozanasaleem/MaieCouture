package com.maiecouture.store.product;

import java.math.BigDecimal;

public record ProductSummaryResponse(
        Long id,
        String name,
        String slug,
        String shortDescription,
        BigDecimal price,
        BigDecimal salePrice,
        String currency,
        boolean featured,
        String mainImage,
        String category,
        PurchaseType purchaseType,
        ProductStatus productStatus,
        boolean madeToOrder
) {

    public static ProductSummaryResponse from(Product product) {
        return new ProductSummaryResponse(
                product.getId(),
                product.getName(),
                product.getSlug(),
                product.getShortDescription(),
                product.getPrice(),
                product.getSalePrice(),
                product.getCurrency(),
                product.isFeatured(),
                product.getMainImage(),
                product.getCategory() != null ? product.getCategory().getName() : null,
                product.getPurchaseType(),
                product.getProductStatus(),
                product.isMadeToOrder()
        );
    }
}
