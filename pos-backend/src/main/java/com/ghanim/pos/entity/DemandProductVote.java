package com.ghanim.pos.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "demand_product_votes", schema = "pos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DemandProductVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "demand_product_id", nullable = false)
    private DemandProduct demandProduct;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;
}
