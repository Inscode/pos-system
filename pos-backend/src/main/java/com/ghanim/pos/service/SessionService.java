package com.ghanim.pos.service;

import com.ghanim.pos.entity.CashMovement;
import com.ghanim.pos.entity.Session;
import com.ghanim.pos.exception.ResourceNotFoundException;
import com.ghanim.pos.repository.CashMovementRepository;
import com.ghanim.pos.repository.SaleRepository;
import com.ghanim.pos.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;
    private final CashMovementRepository cashMovementRepository;
    private final SaleRepository saleRepository;

    public Optional<Session> getCurrentSession() {
        return sessionRepository.findFirstByStatusOrderByOpenedAtDesc("OPEN");
    }

    @Transactional
    public Session openSession(String cashierName, BigDecimal openingFloat) {
        sessionRepository.findFirstByStatusOrderByOpenedAtDesc("OPEN").ifPresent(s -> {
            throw new IllegalArgumentException("A session is already open");
        });

        Session session = Session.builder()
                .cashierName(cashierName)
                .openingFloat(openingFloat)
                .status("OPEN")
                .build();
        session = sessionRepository.save(session);

        cashMovementRepository.save(CashMovement.builder()
                .session(session)
                .type("OPENING")
                .amount(openingFloat)
                .reason("Opening float")
                .build());

        return session;
    }

    @Transactional
    public Map<String, Object> closeSession(Long id, BigDecimal closingCash, String notes) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + id));

        if (!"OPEN".equals(session.getStatus())) {
            throw new IllegalArgumentException("Session is not open");
        }

        session.setStatus("CLOSED");
        session.setClosingCash(closingCash);
        session.setNotes(notes);
        session.setClosedAt(LocalDateTime.now());
        sessionRepository.save(session);

        BigDecimal totalSales = saleRepository.findBySessionId(id).stream()
                .filter(s -> "COMPLETED".equals(s.getStatus()) && "CASH".equals(s.getPaymentMethod()))
                .map(s -> s.getTotal())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cashIn = cashMovementRepository.findBySessionId(id).stream()
                .filter(m -> "CASH_IN".equals(m.getType()))
                .map(CashMovement::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cashOut = cashMovementRepository.findBySessionId(id).stream()
                .filter(m -> "CASH_OUT".equals(m.getType()))
                .map(CashMovement::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal expected = session.getOpeningFloat().add(totalSales).add(cashIn).subtract(cashOut);
        BigDecimal difference = closingCash.subtract(expected);

        Map<String, Object> summary = new HashMap<>();
        summary.put("sessionId", id);
        summary.put("openingFloat", session.getOpeningFloat());
        summary.put("totalCashSales", totalSales);
        summary.put("cashIn", cashIn);
        summary.put("cashOut", cashOut);
        summary.put("expectedCash", expected);
        summary.put("closingCash", closingCash);
        summary.put("difference", difference);
        summary.put("closedAt", session.getClosedAt());
        return summary;
    }
}
