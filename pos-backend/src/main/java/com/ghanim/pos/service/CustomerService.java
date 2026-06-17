package com.ghanim.pos.service;

import com.ghanim.pos.entity.Customer;
import com.ghanim.pos.exception.ResourceNotFoundException;
import com.ghanim.pos.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

    public List<Customer> getAll() {
        return customerRepository.findByActiveTrueOrderByNameAsc();
    }

    public Customer getById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + id));
    }

    public Customer create(Customer customer) {
        return customerRepository.save(customer);
    }

    public Customer update(Long id, Customer updated) {
        Customer customer = getById(id);
        customer.setName(updated.getName());
        customer.setPhone(updated.getPhone());
        customer.setEmail(updated.getEmail());
        customer.setAddress(updated.getAddress());
        customer.setNotes(updated.getNotes());
        return customerRepository.save(customer);
    }

    public void delete(Long id) {
        Customer customer = getById(id);
        customer.setActive(false);
        customerRepository.save(customer);
    }
}
