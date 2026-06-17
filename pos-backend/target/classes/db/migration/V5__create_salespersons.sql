CREATE TABLE pos.salespersons (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    active      BOOLEAN DEFAULT true,
    created_at  TIMESTAMP DEFAULT NOW()
);

INSERT INTO pos.salespersons (name) VALUES
('Ahmed'),
('Mohamed'),
('Farhan'),
('Nizam');
