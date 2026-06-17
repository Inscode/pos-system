package com.ghanim.pos.repository;

import com.ghanim.pos.entity.StockLocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StockLocationRepository extends JpaRepository<StockLocation, Long> {
    Optional<StockLocation> findByProductIdAndLocation(Long productId, String location);
    List<StockLocation> findByLocation(String location);
}
