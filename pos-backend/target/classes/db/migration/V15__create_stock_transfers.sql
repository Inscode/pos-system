CREATE TABLE IF NOT EXISTS public.stock_transfers (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT REFERENCES public.products(id),
    from_location   VARCHAR(20) NOT NULL,
    to_location     VARCHAR(20) NOT NULL,
    quantity        DECIMAL(10,2) NOT NULL,
    notes           TEXT,
    status          VARCHAR(20) DEFAULT 'COMPLETED',
    transferred_by  VARCHAR(100),
    created_at      TIMESTAMP DEFAULT NOW()
);
