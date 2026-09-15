package com.aura.finance.service;

import com.aura.finance.dto.budget.MonthlySummaryResponse;
import com.aura.finance.entity.Budget;
import com.aura.finance.entity.MovementType;
import com.aura.finance.exception.ResourceNotFoundException;
import com.aura.finance.repository.BudgetRepository;
import com.aura.finance.repository.ExpenseRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SummaryServiceTest {

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @InjectMocks
    private SummaryService summaryService;

    @Test
    void calculatesRemainingAndPercentageUsedCorrectly() {
        Budget budget = Budget.builder().id(1L).month(9).year(2026).amount(new BigDecimal("1300.00")).build();
        when(budgetRepository.findByMonthAndYear(9, 2026)).thenReturn(Optional.of(budget));
        when(expenseRepository.sumAmountByTypeAndDateBetween(eq(MovementType.EXPENSE), any(), any()))
                .thenReturn(new BigDecimal("325.00"));
        when(expenseRepository.sumAmountByTypeAndDateBetween(eq(MovementType.INCOME), any(), any()))
                .thenReturn(BigDecimal.ZERO);

        MonthlySummaryResponse summary = summaryService.getMonthlySummary(9, 2026);

        assertThat(summary.budgetAmount()).isEqualByComparingTo("1300.00");
        assertThat(summary.totalSpent()).isEqualByComparingTo("325.00");
        assertThat(summary.remaining()).isEqualByComparingTo("975.00");
        assertThat(summary.percentageUsed()).isEqualByComparingTo("25.00");
    }

    @Test
    void includesTotalIncomeWithoutAffectingRemaining() {
        Budget budget = Budget.builder().id(1L).month(9).year(2026).amount(new BigDecimal("1300.00")).build();
        when(budgetRepository.findByMonthAndYear(9, 2026)).thenReturn(Optional.of(budget));
        when(expenseRepository.sumAmountByTypeAndDateBetween(eq(MovementType.EXPENSE), any(), any()))
                .thenReturn(new BigDecimal("325.00"));
        when(expenseRepository.sumAmountByTypeAndDateBetween(eq(MovementType.INCOME), any(), any()))
                .thenReturn(new BigDecimal("500.00"));

        MonthlySummaryResponse summary = summaryService.getMonthlySummary(9, 2026);

        assertThat(summary.totalIncome()).isEqualByComparingTo("500.00");
        // Los ingresos no deben alterar remaining ni percentageUsed (solo dependen del gasto).
        assertThat(summary.remaining()).isEqualByComparingTo("975.00");
        assertThat(summary.percentageUsed()).isEqualByComparingTo("25.00");
    }

    @Test
    void defaultsToCurrentMonthAndYearWhenNotProvided() {
        LocalDate now = LocalDate.now();
        Budget budget = Budget.builder().id(1L).month(now.getMonthValue()).year(now.getYear())
                .amount(new BigDecimal("1000.00")).build();
        when(budgetRepository.findByMonthAndYear(now.getMonthValue(), now.getYear())).thenReturn(Optional.of(budget));
        when(expenseRepository.sumAmountByTypeAndDateBetween(any(), any(), any())).thenReturn(BigDecimal.ZERO);

        MonthlySummaryResponse summary = summaryService.getMonthlySummary(null, null);

        assertThat(summary.month()).isEqualTo(now.getMonthValue());
        assertThat(summary.year()).isEqualTo(now.getYear());
    }

    @Test
    void throwsNotFoundWhenNoBudgetConfiguredForPeriod() {
        when(budgetRepository.findByMonthAndYear(1, 2030)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> summaryService.getMonthlySummary(1, 2030))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void percentageUsedIsZeroWhenBudgetIsZeroOrNegative() {
        Budget budget = Budget.builder().id(1L).month(9).year(2026).amount(BigDecimal.ZERO).build();
        when(budgetRepository.findByMonthAndYear(9, 2026)).thenReturn(Optional.of(budget));
        when(expenseRepository.sumAmountByTypeAndDateBetween(eq(MovementType.EXPENSE), any(), any()))
                .thenReturn(new BigDecimal("50.00"));
        when(expenseRepository.sumAmountByTypeAndDateBetween(eq(MovementType.INCOME), any(), any()))
                .thenReturn(BigDecimal.ZERO);

        MonthlySummaryResponse summary = summaryService.getMonthlySummary(9, 2026);

        assertThat(summary.percentageUsed()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void usesFirstAndLastDayOfMonthWhenSummingExpenses() {
        Budget budget = Budget.builder().id(1L).month(2).year(2024).amount(new BigDecimal("500.00")).build();
        when(budgetRepository.findByMonthAndYear(2, 2024)).thenReturn(Optional.of(budget));
        when(expenseRepository.sumAmountByTypeAndDateBetween(
                eq(MovementType.EXPENSE), eq(YearMonth.of(2024, 2).atDay(1)), eq(YearMonth.of(2024, 2).atEndOfMonth())))
                .thenReturn(new BigDecimal("100.00"));
        when(expenseRepository.sumAmountByTypeAndDateBetween(eq(MovementType.INCOME), any(), any()))
                .thenReturn(BigDecimal.ZERO);

        MonthlySummaryResponse summary = summaryService.getMonthlySummary(2, 2024);

        // Febrero de 2024 es bisiesto (29 días): valida que se usa el rango correcto del mes.
        assertThat(summary.totalSpent()).isEqualByComparingTo("100.00");
    }
}
