package com.ghanim.pos.service;

import com.ghanim.pos.entity.DemandProduct;
import com.ghanim.pos.entity.DemandProductVote;
import com.ghanim.pos.repository.DemandProductRepository;
import com.ghanim.pos.repository.DemandProductVoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DemandProductService {

    private static final ZoneId STORE_ZONE = ZoneId.of("Asia/Colombo");
    private final DemandProductRepository repository;
    private final DemandProductVoteRepository voteRepository;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAll(LocalDate from, LocalDate to) {
        if ((from == null) != (to == null)) throw new IllegalArgumentException("Both start and end dates are required");
        if (from != null) {
            if (from.isAfter(to)) throw new IllegalArgumentException("Start date must be on or before end date");
            LocalDateTime fromTime = from.atStartOfDay();
            LocalDateTime toExclusive = to.plusDays(1).atStartOfDay();
            return voteRepository.summarizeBetween(fromTime, toExclusive).stream().map(this::toRangeView).toList();
        }
        return repository.findAllByOrderByVoteCountDescNameAsc().stream().map(this::toView).toList();
    }

    @Transactional(readOnly = true)
    public List<String> getSuggestions() {
        return repository.findAllByOrderByNormalizedNameAsc().stream().map(DemandProduct::getName).toList();
    }

    @Transactional
    public Map<String, Object> addVote(String rawName) {
        String name = rawName == null ? "" : rawName.trim().replaceAll("\\s+", " ");
        if (name.isBlank()) throw new IllegalArgumentException("Product name is required");
        if (name.length() > 255) throw new IllegalArgumentException("Product name must be 255 characters or fewer");

        String normalizedName = name.toLowerCase(Locale.ROOT);
        LocalDateTime now = LocalDateTime.now(STORE_ZONE);
        if (repository.incrementVote(normalizedName, now) > 0) {
            DemandProduct existing = repository.findByNormalizedName(normalizedName)
                    .orElseThrow(() -> new IllegalStateException("Demand product was not found after voting"));
            voteRepository.save(DemandProductVote.builder().demandProduct(existing).requestedAt(now).build());
            return toView(repository.findByNormalizedName(normalizedName).orElse(existing));
        }

        DemandProduct product = repository.save(DemandProduct.builder()
                .name(name)
                .normalizedName(normalizedName)
                .voteCount(1)
                .createdAt(now)
                .lastRequestedAt(now)
                .build());
        voteRepository.save(DemandProductVote.builder().demandProduct(product).requestedAt(now).build());
        return toView(product);
    }

    @Transactional
    public void delete(long id) {
        if (!repository.existsById(id)) throw new IllegalArgumentException("Demand product not found");
        repository.deleteById(id);
    }

    private Map<String, Object> toView(DemandProduct product) {
        return Map.of("id", product.getId(), "name", product.getName(),
                "voteCount", product.getVoteCount(),
                "createdAt", product.getCreatedAt().atZone(STORE_ZONE).toOffsetDateTime(),
                "lastRequestedAt", product.getLastRequestedAt().atZone(STORE_ZONE).toOffsetDateTime());
    }

    private Map<String, Object> toRangeView(Object[] row) {
        return Map.of("id", row[0], "name", row[1], "voteCount", row[2],
                "lastRequestedAt", ((LocalDateTime) row[3]).atZone(STORE_ZONE).toOffsetDateTime());
    }
}
