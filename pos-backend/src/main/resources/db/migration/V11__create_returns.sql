CREATE TABLE pos.returns (
    id                  BIGSERIAL PRIMARY KEY,
    original_sale_id    BIGINT REFERENCES pos.sales(id),
    session_id          BIGINT REFERENCES pos.sessions(id),
    salesperson_id      BIGINT REFERENCES pos.salespersons(id),
    return_type         VARCHAR(20) NOT NULL,
    refund_amount       DECIMAL(10,2),
    exchange_sale_id    BIGINT,
    reason              TEXT,
    status              VARCHAR(20) DEFAULT 'COMPLETED',
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pos.return_items (
    id              BIGSERIAL PRIMARY KEY,
    return_id       BIGINT REFERENCES pos.returns(id),
    product_id      BIGINT REFERENCES public.products(id),
    product_name    VARCHAR(200) NOT NULL,
    quantity        DECIMAL(10,2) NOT NULL,
    unit_price      DECIMAL(10,2) NOT NULL,
    subtotal        DECIMAL(10,2) NOT NULL
);
