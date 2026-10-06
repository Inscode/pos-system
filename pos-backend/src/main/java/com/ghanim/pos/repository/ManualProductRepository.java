package com.ghanim.pos.repository;

import com.ghanim.pos.entity.ManualProduct;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ManualProductRepository extends JpaRepository<ManualProduct, Long> {
    List<ManualProduct> findAllByActiveTrueOrderByNameAsc();
    Optional<ManualProduct> findByNameIgnoreCase(String name);
}
