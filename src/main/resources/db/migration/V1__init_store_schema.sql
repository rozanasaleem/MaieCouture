CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(140) NOT NULL UNIQUE,
    description TEXT,
    cover_image VARCHAR(500),
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    short_description VARCHAR(255),
    full_description TEXT,
    price NUMERIC(12, 2),
    sale_price NUMERIC(12, 2),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    main_image VARCHAR(500),
    category_id BIGINT NOT NULL REFERENCES categories(id),
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    purchase_type VARCHAR(40) NOT NULL,
    product_status VARCHAR(40) NOT NULL,
    is_made_to_order BOOLEAN NOT NULL DEFAULT FALSE,
    lead_time_note VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE product_variants (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size VARCHAR(50),
    color VARCHAR(80),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    sku VARCHAR(80) NOT NULL UNIQUE,
    is_made_to_order BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE custom_requests (
    id BIGSERIAL PRIMARY KEY,
    customer_name VARCHAR(180) NOT NULL,
    email VARCHAR(180) NOT NULL,
    phone VARCHAR(40),
    request_type VARCHAR(40) NOT NULL,
    appointment_type VARCHAR(40),
    notes TEXT,
    preferred_date TIMESTAMP,
    status VARCHAR(40) NOT NULL,
    product_id BIGINT REFERENCES products(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(40) NOT NULL UNIQUE,
    customer_name VARCHAR(180) NOT NULL,
    email VARCHAR(180) NOT NULL,
    phone VARCHAR(40),
    shipping_address TEXT NOT NULL,
    payment_status VARCHAR(40) NOT NULL,
    order_status VARCHAR(40) NOT NULL,
    notes TEXT,
    total_amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    variant_id BIGINT REFERENCES product_variants(id),
    product_name VARCHAR(180) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    line_total NUMERIC(12, 2) NOT NULL
);

CREATE TABLE admin_users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(40) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (name, slug, description, cover_image, sort_order)
VALUES
    ('Bridal', 'bridal', 'Made-to-order bridal pieces and appointment-led styling.', 'https://images.example.com/categories/bridal.jpg', 1),
    ('Traditional Wear', 'traditional-wear', 'Thobes and heritage-driven pieces for celebrations.', 'https://images.example.com/categories/traditional.jpg', 2),
    ('Evening Wear', 'evening-wear', 'Statement silhouettes for formal occasions.', 'https://images.example.com/categories/evening.jpg', 3),
    ('Ready-to-Wear', 'ready-to-wear', 'Signature pieces available for direct purchase.', 'https://images.example.com/categories/rtw.jpg', 4),
    ('Accessories', 'accessories', 'Shoes, bags, scarves, and finishing pieces.', 'https://images.example.com/categories/accessories.jpg', 5),
    ('Home', 'home', 'Curated home objects and keepsakes.', 'https://images.example.com/categories/home.jpg', 6);

INSERT INTO products (
    name, slug, short_description, full_description, price, sale_price, currency, main_image,
    category_id, is_featured, is_available, is_published, purchase_type, product_status,
    is_made_to_order, lead_time_note
)
VALUES
    (
        'Layal Draped Evening Dress',
        'layal-draped-evening-dress',
        'Fluid evening silhouette with sculpted shoulder detail.',
        'A signature formal dress designed for weddings, galas, and elevated evening dressing.',
        1850.00,
        NULL,
        'USD',
        'https://images.example.com/products/layal-main.jpg',
        3,
        TRUE,
        TRUE,
        TRUE,
        'DIRECT_PURCHASE',
        'EVERGREEN',
        FALSE,
        'Ships in 3-5 business days'
    ),
    (
        'Noor Bridal Corset Dress',
        'noor-bridal-corset-dress',
        'Architectural bridal dress with sculpted corset bodice.',
        'Bridal look with detachable overskirt and pearl handwork, designed for private fittings and made-to-measure appointments.',
        NULL,
        NULL,
        'USD',
        'https://images.example.com/products/noor-main.jpg',
        1,
        TRUE,
        TRUE,
        TRUE,
        'APPOINTMENT_ONLY',
        'LIMITED',
        TRUE,
        'Available by virtual or in-person appointment'
    );

INSERT INTO product_images (product_id, image_url, sort_order)
VALUES
    (1, 'https://images.example.com/products/layal-detail-1.jpg', 1),
    (1, 'https://images.example.com/products/layal-detail-2.jpg', 2),
    (2, 'https://images.example.com/products/noor-detail-1.jpg', 1);

INSERT INTO product_variants (product_id, size, color, stock_quantity, sku, is_made_to_order)
VALUES
    (1, 'S', 'Ivory', 2, 'MC-EV-001-S-IV', FALSE),
    (1, 'M', 'Ivory', 1, 'MC-EV-001-M-IV', FALSE),
    (2, 'Custom', 'Off White', 0, 'MC-BR-001-CUSTOM', TRUE);

INSERT INTO admin_users (email, password_hash, role)
VALUES
    ('admin@maiecouture.com', '$2a$10$placeholderhashvalueformvpseed', 'SUPER_ADMIN');
