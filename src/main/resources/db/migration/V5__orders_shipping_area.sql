ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS shipping_area_code VARCHAR(40);
