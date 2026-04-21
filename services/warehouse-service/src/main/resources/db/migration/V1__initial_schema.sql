CREATE TABLE warehouses (
    warehouse_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    manager_id INT,
    capacity INT NOT NULL,
    used_capacity INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    phone VARCHAR(50),
    created_at DATE DEFAULT (CURRENT_DATE)
);

CREATE TABLE stock_levels (
    stock_id INT AUTO_INCREMENT PRIMARY KEY,
    warehouse_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 0,
    reserved_quantity INT DEFAULT 0,
    location VARCHAR(100),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_stock_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id),
    UNIQUE KEY uk_warehouse_product (warehouse_id, product_id)
);

CREATE INDEX idx_warehouses_manager ON warehouses(manager_id);
CREATE INDEX idx_warehouses_location ON warehouses(location);
CREATE INDEX idx_stock_product ON stock_levels(product_id);
