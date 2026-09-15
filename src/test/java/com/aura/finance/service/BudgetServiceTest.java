package com.aura.finance.service;

import com.aura.finance.dto.budget.BudgetRequest;
import com.aura.finance.dto.budget.BudgetResponse;
import com.aura.finance.entity.Budget;
import com.aura.finance.exception.DuplicateResourceException;
import com.aura.finance.exception.ResourceNotFoundException;
import com.aura.finance.repository.BudgetRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BudgetServiceTest {

    @Mock
    private BudgetRepository budgetRepository;

    @InjectMocks
    private BudgetService budgetService;

    @Test
    void createsBudgetWhenNoneExistsForThatPeriod() {
        BudgetRequest request = new BudgetRequest(9, 2026, new BigDecimal("1300.00"));
        when(budgetRepository.existsByMonthAndYear(9, 2026)).thenReturn(false);
        when(budgetRepository.save(any(Budget.class))).thenAnswer(invocation -> {
            Budget budget = invocation.getArgument(0);
            budget.setId(1L);
            return budget;
        });

        BudgetResponse response = budgetService.create(request);

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.amount()).isEqualByComparingTo("1300.00");
    }

    @Test
    void rejectsDuplicateBudgetForSamePeriod() {
        BudgetRequest request = new BudgetRequest(9, 2026, new BigDecimal("1300.00"));
        when(budgetRepository.existsByMonthAndYear(9, 2026)).thenReturn(true);

        assertThatThrownBy(() -> budgetService.create(request))
                .isInstanceOf(DuplicateResourceException.class);

        verify(budgetRepository, never()).save(any());
    }

    @Test
    void updateThrowsNotFoundWhenBudgetDoesNotExist() {
        when(budgetRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> budgetService.update(99L, new BudgetRequest(1, 2026, BigDecimal.TEN)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateAllowsKeepingTheSamePeriod() {
        Budget existing = Budget.builder().id(1L).month(9).year(2026).amount(new BigDecimal("1300.00")).build();
        when(budgetRepository.findById(1L)).thenReturn(Optional.of(existing));

        BudgetResponse response = budgetService.update(1L, new BudgetRequest(9, 2026, new BigDecimal("1500.00")));

        assertThat(response.amount()).isEqualByComparingTo("1500.00");
        verify(budgetRepository, never()).existsByMonthAndYear(any(), any());
    }
}
