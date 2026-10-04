CREATE TABLE pos.demand_product_votes (
    id BIGSERIAL PRIMARY KEY,
    demand_product_id BIGINT NOT NULL REFERENCES pos.demand_products(id) ON DELETE CASCADE,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_demand_product_votes_product_date
    ON pos.demand_product_votes (demand_product_id, requested_at);
