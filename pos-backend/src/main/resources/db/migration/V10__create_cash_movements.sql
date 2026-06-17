CREATE TABLE pos.cash_movements (
    id              BIGSERIAL PRIMARY KEY,
    session_id      BIGINT REFERENCES pos.sessions(id),
    type            VARCHAR(20) NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    reason          VARCHAR(200),
    reference_id    BIGINT,
    created_at      TIMESTAMP DEFAULT NOW()
);
