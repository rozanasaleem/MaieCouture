UPDATE products
SET
    is_published = FALSE,
    is_available = FALSE,
    is_featured = FALSE,
    product_status = 'ARCHIVED',
    updated_at = CURRENT_TIMESTAMP
WHERE slug IN ('layal-draped-evening-dress', 'noor-bridal-corset-dress');

