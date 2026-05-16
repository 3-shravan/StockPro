-- Migration: Add Broadcast Fields to Alerts
-- Description: Makes recipient_id optional and adds role-based broadcasting support

-- 1. Modify recipient_id to be nullable
ALTER TABLE alerts MODIFY recipient_id INT NULL;

-- 2. Add new broadcasting columns
ALTER TABLE alerts ADD COLUMN target_role VARCHAR(50) NULL AFTER recipient_id;
ALTER TABLE alerts ADD COLUMN target_warehouse_id INT NULL AFTER target_role;

-- 3. Add indexes for efficient broadcasting lookups
CREATE INDEX idx_alert_target_role ON alerts(target_role);
CREATE INDEX idx_alert_target_warehouse ON alerts(target_warehouse_id);
CREATE INDEX idx_alert_broadcast ON alerts(target_role, target_warehouse_id, is_read);
