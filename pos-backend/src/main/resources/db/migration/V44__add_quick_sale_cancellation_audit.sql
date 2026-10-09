ALTER TABLE pos.quick_sales
    ADD COLUMN cancel_reason VARCHAR(255),
    ADD COLUMN cancelled_at TIMESTAMP;
