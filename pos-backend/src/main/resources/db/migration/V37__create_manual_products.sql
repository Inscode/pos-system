CREATE TABLE pos.manual_products (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    unit_price  DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uq_manual_products_name_ci ON pos.manual_products (LOWER(name));

ALTER TABLE pos.quick_sale_items
    ADD COLUMN manual_product_id BIGINT REFERENCES pos.manual_products(id);

CREATE INDEX idx_quick_sale_items_manual_product_id
    ON pos.quick_sale_items (manual_product_id);
