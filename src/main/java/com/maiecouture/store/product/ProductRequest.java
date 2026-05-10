package com.maiecouture.store.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public record ProductRequest(
        @NotBlank String name,
        @NotBlank String slug,
        String shortDescription,
        String fullDescription,
        @DecimalMin("0.00") BigDecimal price,
        @DecimalMin("0.00") BigDecimal salePrice,
        @NotBlank String currency,
        @NotBlank String mainImage,
        boolean available,
        boolean published,
        boolean featured,
        @NotNull PurchaseType purchaseType,
        @NotNull ProductStatus productStatus,
        boolean madeToOrder,
        String leadTimeNote,
        Long categoryId,
        List<ProductImageRequest> images,
        List<ProductVariantRequest> variants
) {
    public record ProductImageRequest(
            @NotBlank String imageUrl,
            @NotNull Integer sortOrder
    ) {
    }

    public record ProductVariantRequest(
            String size,
            String color,
            @NotNull Integer stockQuantity,
            @NotBlank String sku,
            boolean madeToOrder
    ) {
    }
}
