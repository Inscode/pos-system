CREATE TABLE IF NOT EXISTS public.stock_locations (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT REFERENCES public.products(id),
    location        VARCHAR(20) NOT NULL,
    quantity        DECIMAL(10,2) DEFAULT 0,
    updated_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, location)
);

-- Seed SHOP stock from legacy products.stock column
INSERT INTO public.stock_locations (product_id, location, quantity)
SELECT id, 'SHOP', COALESCE(stock, 0)
FROM public.products
ON CONFLICT (product_id, location)
DO UPDATE SET quantity = EXCLUDED.quantity;
