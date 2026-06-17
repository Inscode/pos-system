package com.ghanim.pos.controller;

import com.ghanim.pos.dto.request.HoldSaleRequest;
import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.entity.HeldSale;
import com.ghanim.pos.service.HeldSaleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/held-sales")
@RequiredArgsConstructor
public class HeldSaleController {

    private final HeldSaleService heldSaleService;

    @PostMapping
    public ResponseEntity<ApiResponse<HeldSale>> hold(@Valid @RequestBody HoldSaleRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(heldSaleService.hold(request), "Sale held"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<HeldSale>>> getBySession(@RequestParam Long sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(heldSaleService.getBySession(sessionId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HeldSale>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(heldSaleService.getById(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        heldSaleService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Held sale deleted"));
    }
}
