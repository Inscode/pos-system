package com.ghanim.pos.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class StockReceiveRequest {
    @NotNull
    private Long productId;
    @NotNull
    @Positive
    private BigDecimal quantity;
    private Long supplierId;
    private BigDecimal costPrice;
    private String notes;
}
