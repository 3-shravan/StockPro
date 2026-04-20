CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100),
    unit_of_measure VARCHAR(50) NOT NULL,
    cost_price DOUBLE NOT NULL DEFAULT 0.0,
    selling_price DOUBLE NOT NULL DEFAULT 0.0,
    reorder_level INT NOT NULL DEFAULT 0,
    max_stock_level INT NOT NULL DEFAULT 0,
    lead_time_days INT NOT NULL DEFAULT 0,
    image_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    barcode VARCHAR(100),
    current_quantity INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_barcode ON products(barcode);
