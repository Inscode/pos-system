package com.ghanim.pos.repository;

import com.ghanim.pos.entity.CashMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CashMovementRepository extends JpaRepository<CashMovement, Long> {
    List<CashMovement> findBySessionId(Long sessionId);
}
