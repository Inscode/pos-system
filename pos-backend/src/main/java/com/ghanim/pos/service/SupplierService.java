package com.ghanim.pos.service;

import com.ghanim.pos.entity.Supplier;
import com.ghanim.pos.exception.ResourceNotFoundException;
import com.ghanim.pos.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public List<Supplier> getAll() {
        return supplierRepository.findByActiveTrue();
    }

    public Supplier create(Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    public Supplier update(Long id, Supplier updated) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + id));
        supplier.setName(updated.getName());
        supplier.setPhone(updated.getPhone());
        supplier.setAddress(updated.getAddress());
        supplier.setNotes(updated.getNotes());
        supplier.setActive(updated.isActive());
        return supplierRepository.save(supplier);
    }
}
