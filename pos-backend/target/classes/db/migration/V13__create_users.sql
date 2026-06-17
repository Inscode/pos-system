CREATE TABLE IF NOT EXISTS public.users (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    username    VARCHAR(50) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20) NOT NULL,
    active      BOOLEAN DEFAULT true,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Passwords: owner123 and cashier123 (bcrypt hashed)
INSERT INTO public.users (name, username, password, role) VALUES
('Owner', 'owner',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'OWNER'),
('Nizam', 'cashier', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNpheoH7m1NFJMuYXcy', 'CASHIER')
ON CONFLICT DO NOTHING;
