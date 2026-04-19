-- ============================================================
--  V1 — Initial Schema
--  auth-service / stockpro_auth database
--
--  Combined Clean Slate Migration (Squashed V1 + V2)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    user_id       INT            NOT NULL AUTO_INCREMENT,
    full_name     VARCHAR(150)   NOT NULL,
    email         VARCHAR(255)   NOT NULL,
    password_hash VARCHAR(255)   NOT NULL,
    phone         VARCHAR(30)    NULL,
    role          VARCHAR(10)    NOT NULL DEFAULT 'STAFF',
    department    VARCHAR(100)   NULL,
    is_active     BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at    DATETIME       NOT NULL,
    last_login_at DATETIME       NULL,

    CONSTRAINT pk_users        PRIMARY KEY (user_id),
    CONSTRAINT uq_users_email  UNIQUE      (email)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
