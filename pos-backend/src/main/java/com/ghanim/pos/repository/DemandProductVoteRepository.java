package com.ghanim.pos.repository;

import com.ghanim.pos.entity.DemandProductVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface DemandProductVoteRepository extends JpaRepository<DemandProductVote, Long> {

    @Query("""
        SELECT v.demandProduct.id, v.demandProduct.name, COUNT(v.id), MAX(v.requestedAt)
        FROM DemandProductVote v
        WHERE v.requestedAt >= :from AND v.requestedAt < :toExclusive
        GROUP BY v.demandProduct.id, v.demandProduct.name
        ORDER BY COUNT(v.id) DESC, v.demandProduct.name ASC
        """)
    List<Object[]> summarizeBetween(@Param("from") LocalDateTime from,
                                    @Param("toExclusive") LocalDateTime toExclusive);
}
