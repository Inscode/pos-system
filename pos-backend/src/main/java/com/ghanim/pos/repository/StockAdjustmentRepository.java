package com.ghanim.pos.repository;

import com.ghanim.pos.entity.StockAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockAdjustmentRepository extends JpaRepository<StockAdjustment, Long> {
    List<StockAdjustment> findByProductId(Long productId);
    List<StockAdjustment> findByProductIdOrderByCreatedAtDesc(Long productId);
}
