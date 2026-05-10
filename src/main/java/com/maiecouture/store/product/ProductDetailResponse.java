package com.maiecouture.store.product;

import java.math.BigDecimal;
import java.util.List;

public record ProductDetailResponse(
        Long id,
        String name,
        String slug,
        String shortDescription,
        String fullDescription,
        BigDecimal price,
        BigDecimal salePrice,
        String currency,
        boolean featured,
        boolean available,
        boolean published,
        String mainImage,
        Long categoryId,
        String category,
        PurchaseType purchaseType,
        ProductStatus productStatus,
        boolean madeToOrder,
        String leadTimeNote,
        List<String> galleryImages,
        List<VariantResponse> variants
) {

    public record VariantResponse(
            Long id,
            String size,
            String color,
            Integer stockQuantity,
            String sku,
            boolean madeToOrder
    ) {
    }

    public static ProductDetailResponse from(Product product) {
        return new ProductDetailResponse(
                product.getId(),
                product.getName(),
                product.getSlug(),
                product.getShortDescription(),
                product.getFullDescription(),
                product.getPrice(),
                product.getSalePrice(),
                product.getCurrency(),
                product.isFeatured(),
                product.isAvailable(),
                product.isPublished(),
                product.getMainImage(),
                product.getCategory() != null ? product.getCategory().getId() : null,
                product.getCategory() != null ? product.getCategory().getName() : null,
                product.getPurchaseType(),
                product.getProductStatus(),
                product.isMadeToOrder(),
                product.getLeadTimeNote(),
                product.getImages().stream()
                        .sorted((left, right) -> Integer.compare(left.getSortOrder(), right.getSortOrder()))
                        .map(ProductImage::getImageUrl)
                        .toList(),
                product.getVariants().stream()
                        .map(variant -> new VariantResponse(
                                variant.getId(),
                                variant.getSize(),
                                variant.getColor(),
                                variant.getStockQuantity(),
                                variant.getSku(),
                                variant.isMadeToOrder()
                        ))
                        .toList()
        );
    }
}
