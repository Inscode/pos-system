package com.ghanim.pos.repository;

import com.ghanim.pos.entity.Salesperson;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SalespersonRepository extends JpaRepository<Salesperson, Long> {
    List<Salesperson> findByActiveTrue();
}
