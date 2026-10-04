package com.ghanim.pos.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quick_sales", schema = "pos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class QuickSale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salesperson_id", nullable = false)
    private Salesperson salesperson;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @Column(nullable = false)
    private String paymentMethod = "CASH";

    @Column(precision = 10, scale = 2)
    private BigDecimal cashTendered;

    @Column(precision = 10, scale = 2)
    private BigDecimal changeAmount;

    private String notes;

    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "quickSale", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<QuickSaleItem> items = new ArrayList<>();
}
