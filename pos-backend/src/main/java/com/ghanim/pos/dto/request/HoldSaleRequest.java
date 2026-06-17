package com.ghanim.pos.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class HoldSaleRequest {
    @NotNull
    private Long sessionId;
    @NotNull
    private Long salespersonId;
    private String saleType = "RETAIL";
    private String customerName;
    @NotNull
    private String items; // JSON string of cart items
    private String note;
}
