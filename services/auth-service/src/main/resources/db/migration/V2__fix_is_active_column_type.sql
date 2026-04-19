-- ============================================================
--  V2 — Fix is_active column type
--
--  MySQL 8.0.17+ deprecated TINYINT(N) display width syntax.
--  Redefine is_active as BOOLEAN (which is an alias for TINYINT
--  without the deprecated display width qualifier).
-- ============================================================

ALTER TABLE users
    MODIFY COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
