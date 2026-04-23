-- ============================================================
--  StockPro — purchase-service Schema
--  Author: Antigravity
-- ============================================================

CREATE TABLE IF NOT EXISTS purchase_orders (
    po_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,
    warehouse_id INT NOT NULL,
    created_by_id INT NOT NULL,
    status VARCHAR(20) NOT NULL COMMENT 'DRAFT, PENDING_APPROVAL, APPROVED, PARTIALLY_RECEIVED, FULLY_RECEIVED, CANCELLED',
    total_amount DOUBLE NOT NULL DEFAULT 0.0,
    order_date DATE NOT NULL,
    expected_date DATE NULL,
    received_date DATE NULL,
    notes TEXT NULL,
    reference_number VARCHAR(50) UNIQUE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS po_line_items (
    line_item_id INT AUTO_INCREMENT PRIMARY KEY,
    po_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_cost DOUBLE NOT NULL,
    total_cost DOUBLE NOT NULL,
    received_qty INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_po_id FOREIGN KEY (po_id) REFERENCES purchase_orders(po_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
