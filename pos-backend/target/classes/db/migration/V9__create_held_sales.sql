CREATE TABLE pos.held_sales (
    id              BIGSERIAL PRIMARY KEY,
    session_id      BIGINT REFERENCES pos.sessions(id),
    salesperson_id  BIGINT REFERENCES pos.salespersons(id),
    sale_type       VARCHAR(20) DEFAULT 'RETAIL',
    customer_name   VARCHAR(100),
    items           JSONB NOT NULL,
    note            VARCHAR(200),
    created_at      TIMESTAMP DEFAULT NOW()
);
