package com.ghanim.pos.controller;

import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.entity.ManualProduct;
import com.ghanim.pos.repository.ManualProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/manual-products")
@RequiredArgsConstructor
public class ManualProductController {

    private final ManualProductRepository manualProductRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ManualProduct>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(manualProductRepository.findAllByOrderByNameAsc()));
    }
}
