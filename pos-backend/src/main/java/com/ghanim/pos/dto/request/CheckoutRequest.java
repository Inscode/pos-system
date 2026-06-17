package com.ghanim.pos.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CheckoutRequest {
    @NotNull
    private Long sessionId;
    @NotNull
    private Long salespersonId;
    private String saleType = "RETAIL";
    private String customerName;
    @NotEmpty
    private List<CartItemRequest> items;
    private BigDecimal cartDiscountPct = BigDecimal.ZERO;
    private String paymentMethod = "CASH";
    private BigDecimal cashTendered;
    private String notes;

    @Data
    public static class CartItemRequest {
        @NotNull
        private Long productId;
        @NotNull
        private BigDecimal quantity;
        @NotNull
        private BigDecimal unitPrice;
        private String priceType = "RETAIL";
        private BigDecimal itemDiscount = BigDecimal.ZERO;
        private BigDecimal itemDiscountPct = BigDecimal.ZERO;
    }
}
