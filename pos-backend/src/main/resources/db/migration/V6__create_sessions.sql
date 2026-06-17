CREATE TABLE pos.sessions (
    id              BIGSERIAL PRIMARY KEY,
    cashier_name    VARCHAR(100) NOT NULL,
    opening_float   DECIMAL(10,2) DEFAULT 0,
    closing_cash    DECIMAL(10,2),
    status          VARCHAR(20) DEFAULT 'OPEN',
    notes           TEXT,
    opened_at       TIMESTAMP DEFAULT NOW(),
    closed_at       TIMESTAMP
);
