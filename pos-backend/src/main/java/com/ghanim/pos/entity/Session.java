package com.ghanim.pos.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sessions", schema = "pos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String cashierName;

    @Column(precision = 10, scale = 2)
    private BigDecimal openingFloat = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal closingCash;

    @Column(nullable = false)
    private String status = "OPEN";

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    private LocalDateTime openedAt;

    private LocalDateTime closedAt;
}
