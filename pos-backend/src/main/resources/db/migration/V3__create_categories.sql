CREATE TABLE IF NOT EXISTS public.categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    active      BOOLEAN DEFAULT true,
    created_at  TIMESTAMP DEFAULT NOW()
);

INSERT INTO public.categories (name) VALUES
('Plastic'),
('Electronic'),
('Gift Items'),
('Umbrella'),
('Net'),
('Aluminium'),
('Lighting'),
('Kitchenware'),
('General')
ON CONFLICT DO NOTHING;
