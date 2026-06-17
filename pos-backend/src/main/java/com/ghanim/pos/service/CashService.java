package com.ghanim.pos.service;

import com.ghanim.pos.dto.request.CashMovementRequest;
import com.ghanim.pos.entity.CashMovement;
import com.ghanim.pos.entity.Session;
import com.ghanim.pos.exception.ResourceNotFoundException;
import com.ghanim.pos.repository.CashMovementRepository;
import com.ghanim.pos.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CashService {

    private final CashMovementRepository cashMovementRepository;
    private final SessionRepository sessionRepository;

    public CashMovement cashIn(CashMovementRequest request) {
        Session session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        return cashMovementRepository.save(CashMovement.builder()
                .session(session)
                .type("CASH_IN")
                .amount(request.getAmount())
                .reason(request.getReason())
                .notes(request.getNotes())
                .build());
    }

    public CashMovement cashOut(CashMovementRequest request) {
        Session session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        return cashMovementRepository.save(CashMovement.builder()
                .session(session)
                .type("CASH_OUT")
                .amount(request.getAmount())
                .reason(request.getReason())
                .notes(request.getNotes())
                .build());
    }

    public List<CashMovement> getMovements(Long sessionId) {
        return cashMovementRepository.findBySessionId(sessionId);
    }
}
