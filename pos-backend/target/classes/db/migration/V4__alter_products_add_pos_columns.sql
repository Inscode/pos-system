-- Create public.products if it doesn't exist (standalone POS install).
-- If it already exists (shared DB with ecommerce), CREATE TABLE IF NOT EXISTS is a no-op
-- and the ALTER TABLE below adds any missing POS columns safely.

CREATE TABLE IF NOT EXISTS public.products (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    specifications  TEXT,
    retail_price    DECIMAL(10,2) NOT NULL DEFAULT 0,
    wholesale_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    cost_price      DECIMAL(10,2),
    stock           INT DEFAULT 0,
    emoji           VARCHAR(10),
    badge           VARCHAR(20),
    category_id     BIGINT REFERENCES public.categories(id),
    image_url       VARCHAR(500),
    active          BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- Add all columns needed by POS (safe no-ops if already present from ecommerce)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS specifications     TEXT,
ADD COLUMN IF NOT EXISTS emoji              VARCHAR(10),
ADD COLUMN IF NOT EXISTS badge              VARCHAR(20),
ADD COLUMN IF NOT EXISTS barcode            VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS unit               VARCHAR(20) DEFAULT 'piece',
ADD COLUMN IF NOT EXISTS min_wholesale_qty  INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS min_stock_alert    DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS product_source     VARCHAR(20) DEFAULT 'SHOP_DIRECT',
ADD COLUMN IF NOT EXISTS fulfillment_source VARCHAR(20) DEFAULT 'SHOP',
ADD COLUMN IF NOT EXISTS show_online        BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_in_pos        BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS online_price       DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS supplier_id        BIGINT;

UPDATE public.products
SET online_price = retail_price
WHERE online_price IS NULL;

UPDATE public.products
SET product_source = 'SHOP_DIRECT',
    fulfillment_source = 'SHOP'
WHERE product_source IS NULL;
