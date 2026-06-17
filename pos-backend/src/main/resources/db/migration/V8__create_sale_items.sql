CREATE TABLE pos.sale_items (
    id                  BIGSERIAL PRIMARY KEY,
    sale_id             BIGINT REFERENCES pos.sales(id),
    product_id          BIGINT REFERENCES public.products(id),
    product_name        VARCHAR(200) NOT NULL,
    barcode             VARCHAR(100),
    quantity            DECIMAL(10,2) NOT NULL,
    unit_price          DECIMAL(10,2) NOT NULL,
    price_type          VARCHAR(20) DEFAULT 'RETAIL',
    item_discount       DECIMAL(10,2) DEFAULT 0,
    item_discount_pct   DECIMAL(5,2) DEFAULT 0,
    subtotal            DECIMAL(10,2) NOT NULL
);
