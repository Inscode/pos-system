CREATE TABLE pos.sales (
    id                  BIGSERIAL PRIMARY KEY,
    session_id          BIGINT REFERENCES pos.sessions(id),
    salesperson_id      BIGINT REFERENCES pos.salespersons(id),
    sale_type           VARCHAR(20) DEFAULT 'RETAIL',
    customer_name       VARCHAR(100),
    subtotal            DECIMAL(10,2) NOT NULL,
    item_discount       DECIMAL(10,2) DEFAULT 0,
    cart_discount       DECIMAL(10,2) DEFAULT 0,
    cart_discount_pct   DECIMAL(5,2) DEFAULT 0,
    total               DECIMAL(10,2) NOT NULL,
    payment_method      VARCHAR(20) DEFAULT 'CASH',
    cash_tendered       DECIMAL(10,2),
    change_amount       DECIMAL(10,2),
    notes               TEXT,
    status              VARCHAR(20) DEFAULT 'COMPLETED',
    created_at          TIMESTAMP DEFAULT NOW()
);
