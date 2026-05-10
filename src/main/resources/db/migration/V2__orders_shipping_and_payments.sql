ALTER TABLE orders
    ADD COLUMN subtotal_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN shipping_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN shipping_country_code VARCHAR(3),
    ADD COLUMN payment_provider VARCHAR(40),
    ADD COLUMN payment_reference VARCHAR(120),
    ADD COLUMN payment_session_id VARCHAR(120),
    ADD COLUMN payment_verified_at TIMESTAMP;

UPDATE orders
SET subtotal_amount = total_amount,
    shipping_fee = 0.00
WHERE subtotal_amount = 0.00;

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_payment_reference
    ON orders (payment_reference)
    WHERE payment_reference IS NOT NULL;
