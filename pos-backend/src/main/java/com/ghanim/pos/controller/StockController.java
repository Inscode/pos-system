package com.ghanim.pos.controller;

import com.ghanim.pos.dto.request.StockAdjustmentRequest;
import com.ghanim.pos.dto.request.StockReceiveRequest;
import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.entity.Product;
import com.ghanim.pos.entity.StockAdjustment;
import com.ghanim.pos.service.StockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;

    @PostMapping("/adjust")
    public ResponseEntity<ApiResponse<StockAdjustment>> adjust(@Valid @RequestBody StockAdjustmentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(stockService.adjustStock(request), "Stock adjusted"));
    }

    @PostMapping("/receive")
    public ResponseEntity<ApiResponse<StockAdjustment>> receive(@Valid @RequestBody StockReceiveRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(stockService.receiveStock(request), "Stock received"));
    }

    @GetMapping("/low")
    public ResponseEntity<ApiResponse<List<Product>>> getLowStock() {
        return ResponseEntity.ok(ApiResponse.ok(stockService.getLowStockProducts()));
    }

    @GetMapping("/adjustments")
    public ResponseEntity<ApiResponse<List<StockAdjustment>>> getAdjustments(
            @RequestParam(required = false) Long productId) {
        return ResponseEntity.ok(ApiResponse.ok(stockService.getAdjustments(productId)));
    }
}
