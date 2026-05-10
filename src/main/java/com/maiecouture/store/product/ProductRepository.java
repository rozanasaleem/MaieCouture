package com.maiecouture.store.product;

import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    Optional<Product> findBySlugAndIsPublishedTrue(String slug);

    List<Product> findAllByPurchaseType(PurchaseType purchaseType);
}
