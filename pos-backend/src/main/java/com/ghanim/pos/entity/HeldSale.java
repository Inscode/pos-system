package com.ghanim.pos.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "held_sales", schema = "pos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class HeldSale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private Session session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salesperson_id")
    private Salesperson salesperson;

    @Column(nullable = false)
    private String saleType = "RETAIL";

    private String customerName;

    @Column(nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String items;

    private String note;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
