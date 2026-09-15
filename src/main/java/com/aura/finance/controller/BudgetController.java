package com.aura.finance.controller;

import com.aura.finance.dto.budget.BudgetRequest;
import com.aura.finance.dto.budget.BudgetResponse;
import com.aura.finance.dto.budget.MonthlySummaryResponse;
import com.aura.finance.service.BudgetService;
import com.aura.finance.service.SummaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;
    private final SummaryService summaryService;

    @PostMapping
    public ResponseEntity<BudgetResponse> create(@Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(budgetService.create(request));
    }

    @PutMapping("/{id}")
    public BudgetResponse update(@PathVariable Long id, @Valid @RequestBody BudgetRequest request) {
        return budgetService.update(id, request);
    }

    @GetMapping
    public List<BudgetResponse> findAll() {
        return budgetService.findAll();
    }

    @GetMapping("/current")
    public BudgetResponse findCurrent() {
        return budgetService.findCurrent();
    }

    @GetMapping("/summary")
    public MonthlySummaryResponse getSummary(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        return summaryService.getMonthlySummary(month, year);
    }
}
