package com.maiecouture.store.product;

import java.math.BigDecimal;
import org.springframework.data.jpa.domain.Specification;

public final class ProductSpecifications {

    private ProductSpecifications() {
    }

    public static Specification<Product> publishedProducts() {
        return (root, query, cb) -> cb.isTrue(root.get("isPublished"));
    }

    public static Specification<Product> keyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return cb.conjunction();
            }

            String likeValue = "%" + keyword.trim().toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), likeValue),
                    cb.like(cb.lower(root.get("fullDescription")), likeValue),
                    cb.like(cb.lower(root.get("shortDescription")), likeValue),
                    cb.like(cb.lower(root.get("slug")), likeValue)
            );
        };
    }

    public static Specification<Product> categorySlug(String categorySlug) {
        return (root, query, cb) -> {
            if (categorySlug == null || categorySlug.isBlank()) {
                return cb.conjunction();
            }
            return cb.equal(cb.lower(root.get("category").get("slug")), categorySlug.toLowerCase());
        };
    }

    public static Specification<Product> featured(Boolean featured) {
        return (root, query, cb) -> featured == null
                ? cb.conjunction()
                : cb.equal(root.get("isFeatured"), featured);
    }

    public static Specification<Product> purchaseType(PurchaseType purchaseType) {
        return (root, query, cb) -> purchaseType == null
                ? cb.conjunction()
                : cb.equal(root.get("purchaseType"), purchaseType);
    }

    public static Specification<Product> productStatus(ProductStatus productStatus) {
        return (root, query, cb) -> productStatus == null
                ? cb.conjunction()
                : cb.equal(root.get("productStatus"), productStatus);
    }

    public static Specification<Product> minPrice(BigDecimal minPrice) {
        return (root, query, cb) -> minPrice == null
                ? cb.conjunction()
                : cb.greaterThanOrEqualTo(root.get("price"), minPrice);
    }

    public static Specification<Product> maxPrice(BigDecimal maxPrice) {
        return (root, query, cb) -> maxPrice == null
                ? cb.conjunction()
                : cb.lessThanOrEqualTo(root.get("price"), maxPrice);
    }
}
