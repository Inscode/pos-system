CREATE TABLE pos.demand_products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    normalized_name VARCHAR(255) NOT NULL UNIQUE,
    vote_count INTEGER NOT NULL DEFAULT 1 CHECK (vote_count > 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_demand_products_votes
    ON pos.demand_products (vote_count DESC, name ASC);
