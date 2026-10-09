package com.ghanim.pos.repository;

import com.ghanim.pos.entity.QuickSaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface QuickSaleItemRepository extends JpaRepository<QuickSaleItem, Long> {

    @Query("""
        SELECT MIN(qi.name), SUM(qi.quantity), SUM(qi.subtotal)
        FROM QuickSaleItem qi
        WHERE qi.quickSale.createdAt BETWEEN :from AND :to
          AND qi.quickSale.status <> 'CANCELLED'
          AND qi.productId IS NULL
        GROUP BY LOWER(qi.name)
        ORDER BY SUM(qi.subtotal) DESC
        """)
    List<Object[]> manualItemSalesBetween(@Param("from") LocalDateTime from,
                                          @Param("to") LocalDateTime to);
}
