package com.ghanim.pos.controller;

import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.dto.request.ManualProductRequest;
import com.ghanim.pos.entity.ManualProduct;
import com.ghanim.pos.repository.ManualProductRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manual-products")
@RequiredArgsConstructor
public class ManualProductController {

    private final ManualProductRepository manualProductRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ManualProduct>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(manualProductRepository.findAllByActiveTrueOrderByNameAsc()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ManualProduct>> save(@Valid @RequestBody ManualProductRequest request) {
        String name = request.getName().trim();
        ManualProduct product = manualProductRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> ManualProduct.builder().name(name).build());
        product.setName(name);
        product.setUnitPrice(request.getUnitPrice());
        product.setActive(true);
        return ResponseEntity.ok(ApiResponse.ok(manualProductRepository.save(product), "Quick Sale product saved"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        ManualProduct product = manualProductRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Quick Sale product not found"));
        product.setActive(false);
        manualProductRepository.save(product);
        return ResponseEntity.noContent().build();
    }
}
