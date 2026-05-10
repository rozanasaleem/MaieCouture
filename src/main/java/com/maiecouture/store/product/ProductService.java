package com.maiecouture.store.product;

import com.maiecouture.store.category.Category;
import com.maiecouture.store.category.CategoryRepository;
import com.maiecouture.store.common.ResourceNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<ProductSummaryResponse> searchPublicProducts(
            String keyword,
            String categorySlug,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean featured,
            PurchaseType purchaseType,
            ProductStatus productStatus
    ) {
        Specification<Product> spec = Specification.allOf(
                ProductSpecifications.publishedProducts(),
                ProductSpecifications.keyword(keyword),
                ProductSpecifications.categorySlug(categorySlug),
                ProductSpecifications.minPrice(minPrice),
                ProductSpecifications.maxPrice(maxPrice),
                ProductSpecifications.featured(featured),
                ProductSpecifications.purchaseType(purchaseType),
                ProductSpecifications.productStatus(productStatus)
        );

        return productRepository.findAll(spec).stream()
                .map(ProductSummaryResponse::from)
                .toList();
    }

    public ProductDetailResponse getPublicProductBySlug(String slug) {
        Product product = productRepository.findBySlugAndIsPublishedTrue(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + slug));
        return ProductDetailResponse.from(product);
    }

    public List<ProductDetailResponse> getAllAdminProducts() {
        return productRepository.findAll().stream()
                .map(ProductDetailResponse::from)
                .toList();
    }

    @Transactional
    public ProductDetailResponse createProduct(ProductRequest request) {
        Product product = new Product();
        apply(product, request);
        return ProductDetailResponse.from(productRepository.save(product));
    }

    @Transactional
    public ProductDetailResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        apply(product, request);
        return ProductDetailResponse.from(productRepository.save(product));
    }

    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product not found: " + id);
        }
        productRepository.deleteById(id);
    }

    @Transactional
    public PriceAdjustmentResponse adjustPrices(PriceAdjustmentRequest request) {
        BigDecimal multiplier = BigDecimal.ONE.add(request.percentage().divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP));
        if (multiplier.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Price multiplier must be greater than 0");
        }

        List<Product> products = request.purchaseType() == null
                ? productRepository.findAll()
                : productRepository.findAllByPurchaseType(request.purchaseType());

        int updated = 0;
        for (Product product : products) {
            boolean touched = false;

            if (product.getPrice() != null) {
                product.setPrice(scaleMoney(product.getPrice().multiply(multiplier)));
                touched = true;
            }

            if (request.includeSalePrice() && product.getSalePrice() != null) {
                product.setSalePrice(scaleMoney(product.getSalePrice().multiply(multiplier)));
                touched = true;
            }

            if (touched) {
                product.touch();
                updated++;
            }
        }
        productRepository.saveAll(products);

        return new PriceAdjustmentResponse(updated, request.percentage(), request.includeSalePrice(), request.purchaseType());
    }

    private void apply(Product product, ProductRequest request) {
        product.setName(request.name());
        product.setSlug(request.slug());
        product.setShortDescription(request.shortDescription());
        product.setFullDescription(request.fullDescription());
        product.setPrice(request.price());
        product.setSalePrice(request.salePrice());
        product.setCurrency(request.currency().toUpperCase());
        product.setMainImage(request.mainImage());
        product.setAvailable(request.available());
        product.setPublished(request.published());
        product.setFeatured(request.featured());
        product.setPurchaseType(request.purchaseType());
        product.setProductStatus(request.productStatus());
        product.setMadeToOrder(request.madeToOrder());
        product.setLeadTimeNote(request.leadTimeNote());
        product.setCategory(resolveCategory(request.categoryId()));
        product.setImages(mapImages(product, request.images()));
        product.setVariants(mapVariants(product, request.variants()));
        product.touch();
    }

    private Category resolveCategory(Long categoryId) {
        if (categoryId == null) {
            throw new IllegalArgumentException("categoryId is required");
        }
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categoryId));
    }

    private List<ProductImage> mapImages(Product product, List<ProductRequest.ProductImageRequest> imageRequests) {
        List<ProductImage> images = new ArrayList<>();
        if (imageRequests == null) {
            return images;
        }

        for (ProductRequest.ProductImageRequest imageRequest : imageRequests) {
            ProductImage image = new ProductImage();
            image.setProduct(product);
            image.setImageUrl(imageRequest.imageUrl());
            image.setSortOrder(imageRequest.sortOrder());
            images.add(image);
        }
        return images;
    }

    private List<ProductVariant> mapVariants(Product product, List<ProductRequest.ProductVariantRequest> variantRequests) {
        List<ProductVariant> variants = new ArrayList<>();
        if (variantRequests == null) {
            return variants;
        }

        for (ProductRequest.ProductVariantRequest variantRequest : variantRequests) {
            ProductVariant variant = new ProductVariant();
            variant.setProduct(product);
            variant.setSize(variantRequest.size());
            variant.setColor(variantRequest.color());
            variant.setStockQuantity(variantRequest.stockQuantity());
            variant.setSku(variantRequest.sku());
            variant.setMadeToOrder(variantRequest.madeToOrder());
            variants.add(variant);
        }
        return variants;
    }

    private BigDecimal scaleMoney(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP);
    }
}
