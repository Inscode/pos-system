CREATE TABLE pos.suppliers (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    phone       VARCHAR(20),
    address     TEXT,
    notes       TEXT,
    active      BOOLEAN DEFAULT true,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

INSERT INTO pos.suppliers (name) VALUES
('General Stock'),
('Rainco (Pvt) Ltd'),
('Walk-in Purchase'),
('Unknown Supplier');
