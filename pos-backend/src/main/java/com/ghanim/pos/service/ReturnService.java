package com.ghanim.pos.service;

import com.ghanim.pos.dto.request.ReturnRequest;
import com.ghanim.pos.entity.*;
import com.ghanim.pos.exception.ResourceNotFoundException;
import com.ghanim.pos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReturnService {

    private final ReturnRepository returnRepository;
    private final ReturnItemRepository returnItemRepository;
    private final SaleRepository saleRepository;
    private final SessionRepository sessionRepository;
    private final SalespersonRepository salespersonRepository;
    private final ProductRepository productRepository;
    private final CashMovementRepository cashMovementRepository;
    private final StockService stockService;

    @Transactional
    public Return processReturn(ReturnRequest request) {
        Sale originalSale = saleRepository.findById(request.getOriginalSaleId())
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found: " + request.getOriginalSaleId()));
        Session session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        Salesperson salesperson = salespersonRepository.findById(request.getSalespersonId())
                .orElseThrow(() -> new ResourceNotFoundException("Salesperson not found"));

        BigDecimal refundAmount = BigDecimal.ZERO;
        List<ReturnItem> returnItems = new ArrayList<>();

        for (ReturnRequest.ReturnItemRequest item : request.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + item.getProductId()));

            BigDecimal itemTotal = item.getUnitPrice().multiply(item.getQuantity());
            refundAmount = refundAmount.add(itemTotal);

            returnItems.add(ReturnItem.builder()
                    .product(product)
                    .productName(product.getName())
                    .quantity(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .subtotal(itemTotal)
                    .build());

            // Restore SHOP stock
            stockService.addShopStock(product, item.getQuantity());
        }

        Return returnRecord = Return.builder()
                .originalSale(originalSale)
                .session(session)
                .salesperson(salesperson)
                .returnType(request.getReturnType())
                .refundAmount(refundAmount)
                .reason(request.getReason())
                .status("COMPLETED")
                .build();

        returnRecord = returnRepository.save(returnRecord);

        for (ReturnItem item : returnItems) {
            item.setReturnRecord(returnRecord);
        }
        returnItemRepository.saveAll(returnItems);

        if ("CASH_REFUND".equals(request.getReturnType())) {
            cashMovementRepository.save(CashMovement.builder()
                    .session(session)
                    .type("REFUND")
                    .amount(refundAmount.negate())
                    .reason("Return for sale #" + request.getOriginalSaleId())
                    .referenceId(returnRecord.getId())
                    .build());
        }

        return returnRecord;
    }

    public Return getById(Long id) {
        return returnRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Return not found: " + id));
    }
}
