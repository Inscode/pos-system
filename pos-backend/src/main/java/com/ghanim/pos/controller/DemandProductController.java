package com.ghanim.pos.controller;

import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.service.DemandProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/demand-products")
@RequiredArgsConstructor
public class DemandProductController {

    private final DemandProductService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAll(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(service.getAll(from, to)));
    }

    @GetMapping("/suggestions")
    public ResponseEntity<ApiResponse<List<String>>> getSuggestions() {
        return ResponseEntity.ok(ApiResponse.ok(service.getSuggestions()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> addVote(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok(service.addVote(body.get("name")), "Demand recorded"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
