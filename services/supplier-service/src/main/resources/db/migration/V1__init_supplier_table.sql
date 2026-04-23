CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    tax_id VARCHAR(100),
    payment_terms VARCHAR(255),
    lead_time_days INT DEFAULT 0,
    rating DOUBLE DEFAULT 0.0,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE (tax_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed data for testing
INSERT INTO suppliers (name, contact_person, email, phone, city, country, tax_id, payment_terms, lead_time_days, rating)
VALUES 
('Global Logix', 'John Doe', 'john@globallogix.example', '+1-555-0199', 'New York', 'USA', 'TAX-GL-001', 'NET-30', 5, 4.5),
('Tech Supply Co', 'Jane Smith', 'jane@techsupply.example', '+44-20-7946-0958', 'London', 'UK', 'TAX-TS-992', 'NET-15', 3, 4.8);
