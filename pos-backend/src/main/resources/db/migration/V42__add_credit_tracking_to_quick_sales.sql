ALTER TABLE pos.quick_sales
    ADD COLUMN customer_name VARCHAR(255),
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED';

UPDATE pos.quick_sales
SET status = 'CREDIT'
WHERE payment_method = 'CREDIT';
