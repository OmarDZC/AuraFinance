package com.aura.finance.service;

import com.aura.finance.dto.budget.BudgetRequest;
import com.aura.finance.dto.budget.BudgetResponse;
import com.aura.finance.entity.Budget;
import com.aura.finance.exception.DuplicateResourceException;
import com.aura.finance.exception.ResourceNotFoundException;
import com.aura.finance.repository.BudgetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BudgetService {

    private final BudgetRepository budgetRepository;

    @Transactional
    public BudgetResponse create(BudgetRequest request) {
        if (budgetRepository.existsByMonthAndYear(request.month(), request.year())) {
            throw new DuplicateResourceException(
                    "Ya existe un presupuesto para " + request.month() + "/" + request.year());
        }

        Budget budget = Budget.builder()
                .month(request.month())
                .year(request.year())
                .amount(request.amount())
                .build();

        return toResponse(budgetRepository.save(budget));
    }

    @Transactional
    public BudgetResponse update(Long id, BudgetRequest request) {
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Presupuesto no encontrado con id " + id));

        boolean periodChanged = !budget.getMonth().equals(request.month()) || !budget.getYear().equals(request.year());
        if (periodChanged && budgetRepository.existsByMonthAndYear(request.month(), request.year())) {
            throw new DuplicateResourceException(
                    "Ya existe un presupuesto para " + request.month() + "/" + request.year());
        }

        budget.setMonth(request.month());
        budget.setYear(request.year());
        budget.setAmount(request.amount());

        return toResponse(budget);
    }

    public List<BudgetResponse> findAll() {
        return budgetRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public BudgetResponse findCurrent() {
        LocalDate now = LocalDate.now();
        return budgetRepository.findByMonthAndYear(now.getMonthValue(), now.getYear())
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No hay presupuesto configurado para " + now.getMonthValue() + "/" + now.getYear()));
    }

    private BudgetResponse toResponse(Budget budget) {
        return new BudgetResponse(budget.getId(), budget.getMonth(), budget.getYear(), budget.getAmount());
    }
}
