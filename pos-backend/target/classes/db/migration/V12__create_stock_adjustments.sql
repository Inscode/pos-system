CREATE TABLE pos.stock_adjustments (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT REFERENCES public.products(id),
    location        VARCHAR(20) DEFAULT 'SHOP',
    previous_qty    DECIMAL(10,2),
    new_qty         DECIMAL(10,2),
    difference      DECIMAL(10,2),
    reason          VARCHAR(200),
    adjusted_by     VARCHAR(100),
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);
