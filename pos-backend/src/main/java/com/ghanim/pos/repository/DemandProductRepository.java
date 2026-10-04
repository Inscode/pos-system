package com.ghanim.pos.repository;

import com.ghanim.pos.entity.DemandProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface DemandProductRepository extends JpaRepository<DemandProduct, Long> {
    Optional<DemandProduct> findByNormalizedName(String normalizedName);
    List<DemandProduct> findAllByOrderByVoteCountDescNameAsc();
    List<DemandProduct> findAllByOrderByNormalizedNameAsc();

    @Modifying
    @Query("UPDATE DemandProduct d SET d.voteCount = d.voteCount + 1, d.lastRequestedAt = :requestedAt WHERE d.normalizedName = :normalizedName")
    int incrementVote(@Param("normalizedName") String normalizedName,
                      @Param("requestedAt") LocalDateTime requestedAt);
}
