CREATE TABLE alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_id INT NOT NULL,
    type VARCHAR(30) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message VARCHAR(2000) NOT NULL,
    related_product_id INT NULL,
    related_warehouse_id INT NULL,
    channel VARCHAR(20) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_by INT NULL,
    acknowledged_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alert_recipient ON alerts(recipient_id);
CREATE INDEX idx_alert_recipient_read ON alerts(recipient_id, is_read);
CREATE INDEX idx_alert_type ON alerts(type);
CREATE INDEX idx_alert_severity ON alerts(severity);
CREATE INDEX idx_alert_related_product ON alerts(related_product_id);
CREATE INDEX idx_alert_ack ON alerts(is_acknowledged);
CREATE INDEX idx_alert_created_at ON alerts(created_at);
