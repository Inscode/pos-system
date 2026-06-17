CREATE TABLE pos.customers (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    phone       VARCHAR(20),
    email       VARCHAR(150),
    address     TEXT,
    notes       TEXT,
    active      BOOLEAN DEFAULT true,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);
