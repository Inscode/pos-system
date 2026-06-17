package com.ghanim.pos.repository;

import com.ghanim.pos.entity.HeldSale;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HeldSaleRepository extends JpaRepository<HeldSale, Long> {
    List<HeldSale> findBySessionId(Long sessionId);
}
