-- Migration: Fix missing broadcast columns
-- Description: Ensures target_role and target_warehouse_id exist in the alerts table

-- Add target_role if missing
SET @dropdown = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'stockpro_alert' AND TABLE_NAME = 'alerts' AND COLUMN_NAME = 'target_role');
SET @sql = IF(@dropdown = 0, 'ALTER TABLE alerts ADD COLUMN target_role VARCHAR(50) NULL AFTER recipient_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add target_warehouse_id if missing
SET @dropdown = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'stockpro_alert' AND TABLE_NAME = 'alerts' AND COLUMN_NAME = 'target_warehouse_id');
SET @sql = IF(@dropdown = 0, 'ALTER TABLE alerts ADD COLUMN target_warehouse_id INT NULL AFTER target_role', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
