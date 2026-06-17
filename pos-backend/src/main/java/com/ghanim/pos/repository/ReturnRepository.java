package com.ghanim.pos.repository;

import com.ghanim.pos.entity.Return;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface ReturnRepository extends JpaRepository<Return, Long> {
    Page<Return> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to, Pageable pageable);
}
