ALTER TABLE pos.quick_sales
    ADD COLUMN customer_id BIGINT REFERENCES pos.customers(id);
