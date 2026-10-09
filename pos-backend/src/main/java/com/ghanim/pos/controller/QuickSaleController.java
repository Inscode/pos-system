package com.ghanim.pos.controller;

import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.service.QuickSaleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quick-sales")
@RequiredArgsConstructor
public class QuickSaleController {

    private final QuickSaleService quickSaleService;

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> create(@RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(ApiResponse.ok(quickSaleService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getByDate(
            @RequestParam(required = false) String date,
            @RequestParam(required = false) Long salespersonId) {
        LocalDate d = (date != null && !date.isBlank()) ? LocalDate.parse(date) : LocalDate.now();
        return ResponseEntity.ok(ApiResponse.ok(quickSaleService.getByDate(d, salespersonId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(quickSaleService.getById(id)));
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<ApiResponse<Void>> recordPayment(
            @PathVariable Long id,
            @RequestBody Map<String, BigDecimal> body) {
        quickSaleService.recordPayment(id, body.get("amount"));
        return ResponseEntity.ok(ApiResponse.ok(null, "Payment recorded"));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancel(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        quickSaleService.cancel(id, body.get("pin"), body.get("reason"));
        return ResponseEntity.ok(ApiResponse.ok(null, "Quick sale cancelled"));
    }
}
