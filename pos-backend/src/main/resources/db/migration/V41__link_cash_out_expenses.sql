ALTER TABLE pos.expenses
    ADD COLUMN cash_movement_id BIGINT UNIQUE REFERENCES pos.cash_movements(id);
