package com.ghanim.pos.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class StockAdjustmentRequest {
    @NotNull
    private Long productId;
    @NotNull
    private BigDecimal newQuantity;
    @NotNull
    private String reason;
    private String adjustedBy;
    private String notes;
}
