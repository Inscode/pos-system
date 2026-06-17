package com.ghanim.pos.service;

import com.ghanim.pos.dto.request.StockAdjustmentRequest;
import com.ghanim.pos.dto.request.StockReceiveRequest;
import com.ghanim.pos.entity.Product;
import com.ghanim.pos.entity.StockAdjustment;
import com.ghanim.pos.entity.StockLocation;
import com.ghanim.pos.exception.ResourceNotFoundException;
import com.ghanim.pos.repository.ProductRepository;
import com.ghanim.pos.repository.StockAdjustmentRepository;
import com.ghanim.pos.repository.StockLocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StockService {

    private final StockLocationRepository stockLocationRepository;
    private final StockAdjustmentRepository stockAdjustmentRepository;
    private final ProductRepository productRepository;

    public BigDecimal getShopStock(Long productId) {
        return stockLocationRepository.findByProductIdAndLocation(productId, "SHOP")
                .map(StockLocation::getQuantity)
                .orElse(BigDecimal.ZERO);
    }

    @Transactional
    public void deductShopStock(Product product, BigDecimal quantity) {
        StockLocation sl = stockLocationRepository
                .findByProductIdAndLocation(product.getId(), "SHOP")
                .orElseGet(() -> createShopStockEntry(product));

        BigDecimal previous = sl.getQuantity();
        sl.setQuantity(previous.subtract(quantity));
        stockLocationRepository.save(sl);

        stockAdjustmentRepository.save(StockAdjustment.builder()
                .product(product)
                .location("SHOP")
                .previousQty(previous)
                .newQty(sl.getQuantity())
                .difference(quantity.negate())
                .reason("SALE")
                .build());
    }

    @Transactional
    public void addShopStock(Product product, BigDecimal quantity) {
        StockLocation sl = stockLocationRepository
                .findByProductIdAndLocation(product.getId(), "SHOP")
                .orElseGet(() -> createShopStockEntry(product));

        BigDecimal previous = sl.getQuantity();
        sl.setQuantity(previous.add(quantity));
        stockLocationRepository.save(sl);
    }

    @Transactional
    public StockAdjustment adjustStock(StockAdjustmentRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + request.getProductId()));

        StockLocation sl = stockLocationRepository
                .findByProductIdAndLocation(product.getId(), "SHOP")
                .orElseGet(() -> createShopStockEntry(product));

        BigDecimal previous = sl.getQuantity();
        sl.setQuantity(request.getNewQuantity());
        stockLocationRepository.save(sl);

        return stockAdjustmentRepository.save(StockAdjustment.builder()
                .product(product)
                .location("SHOP")
                .previousQty(previous)
                .newQty(request.getNewQuantity())
                .difference(request.getNewQuantity().subtract(previous))
                .reason(request.getReason())
                .adjustedBy(request.getAdjustedBy())
                .notes(request.getNotes())
                .build());
    }

    @Transactional
    public StockAdjustment receiveStock(StockReceiveRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + request.getProductId()));

        StockLocation sl = stockLocationRepository
                .findByProductIdAndLocation(product.getId(), "SHOP")
                .orElseGet(() -> createShopStockEntry(product));

        BigDecimal previous = sl.getQuantity();
        sl.setQuantity(previous.add(request.getQuantity()));
        stockLocationRepository.save(sl);

        if (request.getCostPrice() != null) {
            product.setCostPrice(request.getCostPrice());
            productRepository.save(product);
        }

        return stockAdjustmentRepository.save(StockAdjustment.builder()
                .product(product)
                .location("SHOP")
                .previousQty(previous)
                .newQty(sl.getQuantity())
                .difference(request.getQuantity())
                .reason("PURCHASE")
                .notes(request.getNotes())
                .build());
    }

    public List<Product> getLowStockProducts() {
        return productRepository.findLowStockProducts();
    }

    public List<StockAdjustment> getAdjustments(Long productId) {
        if (productId != null) {
            return stockAdjustmentRepository.findByProductIdOrderByCreatedAtDesc(productId);
        }
        return stockAdjustmentRepository.findAll();
    }

    private StockLocation createShopStockEntry(Product product) {
        return stockLocationRepository.save(StockLocation.builder()
                .product(product)
                .location("SHOP")
                .quantity(BigDecimal.ZERO)
                .build());
    }
}
