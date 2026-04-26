CREATE TABLE stock_movements (
    movement_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    warehouse_id INT NOT NULL,
    movement_type VARCHAR(30) NOT NULL,
    quantity INT NOT NULL,
    reference_id INT NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    unit_cost DOUBLE NOT NULL DEFAULT 0.0,
    performed_by INT NOT NULL,
    notes VARCHAR(2000),
    movement_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    balance_after INT NOT NULL,
    CONSTRAINT chk_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_unit_cost_non_negative CHECK (unit_cost >= 0)
);

CREATE INDEX idx_movement_product ON stock_movements(product_id);
CREATE INDEX idx_movement_warehouse ON stock_movements(warehouse_id);
CREATE INDEX idx_movement_type ON stock_movements(movement_type);
CREATE INDEX idx_movement_reference ON stock_movements(reference_id);
CREATE INDEX idx_movement_date ON stock_movements(movement_date);
CREATE INDEX idx_movement_performed_by ON stock_movements(performed_by);
