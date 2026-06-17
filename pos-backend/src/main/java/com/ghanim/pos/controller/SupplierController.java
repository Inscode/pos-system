package com.ghanim.pos.controller;

import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.entity.Supplier;
import com.ghanim.pos.service.SupplierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Supplier>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(supplierService.getAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Supplier>> create(@RequestBody Supplier supplier) {
        return ResponseEntity.ok(ApiResponse.ok(supplierService.create(supplier), "Supplier created"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Supplier>> update(@PathVariable Long id, @RequestBody Supplier supplier) {
        return ResponseEntity.ok(ApiResponse.ok(supplierService.update(id, supplier)));
    }
}
