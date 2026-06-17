package com.ghanim.pos.service;

import com.ghanim.pos.entity.*;
import com.ghanim.pos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final CashMovementRepository cashMovementRepository;
    private final SessionRepository sessionRepository;

    public Map<String, Object> getDailyReport(LocalDate date) {
        LocalDateTime from = date.atStartOfDay();
        LocalDateTime to = date.atTime(23, 59, 59);

        List<Sale> sales = saleRepository.findCompletedSalesBetween(from, to);

        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal retailAmount = BigDecimal.ZERO;
        BigDecimal wholesaleAmount = BigDecimal.ZERO;
        BigDecimal totalProfit = BigDecimal.ZERO;
        BigDecimal cashSales = BigDecimal.ZERO;
        BigDecimal cardSales = BigDecimal.ZERO;
        BigDecimal creditSales = BigDecimal.ZERO;

        Map<Long, Map<String, Object>> salespersonMap = new HashMap<>();

        for (Sale sale : sales) {
            totalAmount = totalAmount.add(sale.getTotal());
            if ("RETAIL".equals(sale.getSaleType())) {
                retailAmount = retailAmount.add(sale.getTotal());
            } else {
                wholesaleAmount = wholesaleAmount.add(sale.getTotal());
            }
            switch (sale.getPaymentMethod()) {
                case "CASH" -> cashSales = cashSales.add(sale.getTotal());
                case "CARD" -> cardSales = cardSales.add(sale.getTotal());
                case "CREDIT" -> creditSales = creditSales.add(sale.getTotal());
            }

            // Salesperson breakdown
            if (sale.getSalesperson() != null) {
                Long spId = sale.getSalesperson().getId();
                Map<String, Object> spData = salespersonMap.computeIfAbsent(spId, k -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("name", sale.getSalesperson().getName());
                    m.put("salesCount", 0);
                    m.put("totalAmount", BigDecimal.ZERO);
                    m.put("profit", BigDecimal.ZERO);
                    return m;
                });
                spData.put("salesCount", (int) spData.get("salesCount") + 1);
                spData.put("totalAmount", ((BigDecimal) spData.get("totalAmount")).add(sale.getTotal()));
            }

            // Profit calculation
            List<SaleItem> items = saleItemRepository.findBySaleId(sale.getId());
            for (SaleItem item : items) {
                if (item.getProduct() != null && item.getProduct().getCostPrice() != null) {
                    BigDecimal profit = item.getUnitPrice()
                            .subtract(item.getProduct().getCostPrice())
                            .multiply(item.getQuantity())
                            .subtract(item.getItemDiscount());
                    totalProfit = totalProfit.add(profit);
                }
            }
        }

        // Cash summary from open session
        Optional<Session> currentSession = sessionRepository.findFirstByStatusOrderByOpenedAtDesc("OPEN");
        BigDecimal openingFloat = currentSession.map(Session::getOpeningFloat).orElse(BigDecimal.ZERO);

        List<CashMovement> movements = currentSession
                .map(s -> cashMovementRepository.findBySessionId(s.getId()))
                .orElse(List.of());

        BigDecimal cashIn = movements.stream().filter(m -> "CASH_IN".equals(m.getType()))
                .map(CashMovement::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal cashOut = movements.stream().filter(m -> "CASH_OUT".equals(m.getType()))
                .map(CashMovement::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal expectedCash = openingFloat.add(cashSales).add(cashIn).subtract(cashOut);

        // Cash-out breakdown grouped by reason
        Map<String, BigDecimal> cashOutByReason = movements.stream()
                .filter(m -> "CASH_OUT".equals(m.getType()))
                .collect(Collectors.groupingBy(
                        m -> m.getReason() != null ? m.getReason() : "OTHER",
                        Collectors.reducing(BigDecimal.ZERO, CashMovement::getAmount, BigDecimal::add)
                ));

        BigDecimal margin = totalAmount.compareTo(BigDecimal.ZERO) > 0
                ? totalProfit.divide(totalAmount, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("date", date.toString());
        report.put("totalSales", sales.size());
        report.put("totalAmount", totalAmount);
        report.put("retailAmount", retailAmount);
        report.put("wholesaleAmount", wholesaleAmount);
        report.put("totalProfit", totalProfit);
        report.put("margin", margin.setScale(1, RoundingMode.HALF_UP));
        report.put("salespersonBreakdown", new ArrayList<>(salespersonMap.values()));
        Map<String, Object> cashSummary = new LinkedHashMap<>();
        cashSummary.put("openingFloat", openingFloat);
        cashSummary.put("totalCashSales", cashSales);
        cashSummary.put("cashIn", cashIn);
        cashSummary.put("cashOut", cashOut);
        cashSummary.put("expectedCash", expectedCash);
        cashSummary.put("cashOutByReason", cashOutByReason);
        report.put("cashSummary", cashSummary);
        report.put("paymentBreakdown", Map.of(
                "cash", cashSales,
                "card", cardSales,
                "credit", creditSales
        ));
        return report;
    }
}
