package com.aura.finance.service;

import com.aura.finance.dto.statistics.SpendingPaceStatus;
import com.aura.finance.dto.statistics.StatisticsResponse;
import com.aura.finance.entity.Budget;
import com.aura.finance.entity.Category;
import com.aura.finance.entity.Expense;
import com.aura.finance.entity.MovementType;
import com.aura.finance.repository.BudgetRepository;
import com.aura.finance.repository.ExpenseRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StatisticsServiceTest {

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    private StatisticsService statisticsService;

    private final Category food = Category.builder().id(1L).name("Alimentación").build();
    private final Category transport = Category.builder().id(2L).name("Transporte").build();

    private StatisticsService service() {
        return new StatisticsService(budgetRepository, expenseRepository);
    }

    private long nextId = 1L;

    private Expense expense(BigDecimal amount, LocalDate date, Category category) {
        return Expense.builder().id(nextId++)
                .type(MovementType.EXPENSE).amount(amount).date(date).category(category).build();
    }

    private Expense income(BigDecimal amount, LocalDate date, Category category) {
        return Expense.builder().id(nextId++)
                .type(MovementType.INCOME).amount(amount).date(date).category(category).build();
    }

    @Test
    void aPastMonthConsidersAllOfItsDaysAndIgnoresIncomeAsExpense() {
        statisticsService = service();
        YearMonth pastMonth = YearMonth.of(2024, 2); // pasado respecto a "hoy" real, siempre
        LocalDate start = pastMonth.atDay(1);
        LocalDate end = pastMonth.atEndOfMonth();

        when(budgetRepository.findByMonthAndYear(2, 2024)).thenReturn(
                Optional.of(Budget.builder().id(1L).month(2).year(2024).amount(new BigDecimal("500.00")).build()));
        when(expenseRepository.findByDateBetween(start, end)).thenReturn(List.of(
                expense(new BigDecimal("100.00"), LocalDate.of(2024, 2, 5), food),
                expense(new BigDecimal("50.00"), LocalDate.of(2024, 2, 10), transport),
                income(new BigDecimal("1000.00"), LocalDate.of(2024, 2, 1), food)
        ));
        when(expenseRepository.findByDateBetween(YearMonth.of(2024, 1).atDay(1), YearMonth.of(2024, 1).atEndOfMonth()))
                .thenReturn(List.of());

        StatisticsResponse stats = statisticsService.getStatistics(2, 2024);

        assertThat(stats.daysConsidered()).isEqualTo(29); // 2024 es bisiesto
        assertThat(stats.totalExpenses()).isEqualByComparingTo("150.00");
        assertThat(stats.totalIncome()).isEqualByComparingTo("1000.00");
        assertThat(stats.remaining()).isEqualByComparingTo("350.00");
        assertThat(stats.percentageUsed()).isEqualByComparingTo("30.00");
        assertThat(stats.highestSpendingCategory().category().name()).isEqualTo("Alimentación");
        assertThat(stats.highestSpendingDay().amount()).isEqualByComparingTo("100.00");
        assertThat(stats.dailySpending()).hasSize(29);
        assertThat(stats.dailySpending().get(28).cumulativeAmount()).isEqualByComparingTo("150.00");
    }

    @Test
    void withoutBudgetStillReturnsExpenseFiguresButNoBudgetDependentOnes() {
        statisticsService = service();
        YearMonth pastMonth = YearMonth.of(2024, 3);
        LocalDate start = pastMonth.atDay(1);
        LocalDate end = pastMonth.atEndOfMonth();

        when(budgetRepository.findByMonthAndYear(3, 2024)).thenReturn(Optional.empty());
        when(expenseRepository.findByDateBetween(any(), any())).thenReturn(List.of());
        when(expenseRepository.findByDateBetween(start, end)).thenReturn(
                List.of(expense(new BigDecimal("40.00"), LocalDate.of(2024, 3, 1), food)));

        StatisticsResponse stats = statisticsService.getStatistics(3, 2024);

        assertThat(stats.hasBudget()).isFalse();
        assertThat(stats.budgetAmount()).isNull();
        assertThat(stats.remaining()).isNull();
        assertThat(stats.percentageUsed()).isNull();
        assertThat(stats.spendingPace()).isNull();
        assertThat(stats.totalExpenses()).isEqualByComparingTo("40.00");
    }

    @Test
    void previousMonthComparisonIsNullWhenPreviousMonthHasNoExpenses() {
        statisticsService = service();
        YearMonth month = YearMonth.of(2024, 5);
        when(budgetRepository.findByMonthAndYear(5, 2024)).thenReturn(Optional.empty());
        when(expenseRepository.findByDateBetween(month.atDay(1), month.atEndOfMonth())).thenReturn(
                List.of(expense(new BigDecimal("30.00"), LocalDate.of(2024, 5, 2), food)));
        when(expenseRepository.findByDateBetween(YearMonth.of(2024, 4).atDay(1), YearMonth.of(2024, 4).atEndOfMonth()))
                .thenReturn(List.of());

        StatisticsResponse stats = statisticsService.getStatistics(5, 2024);

        assertThat(stats.previousMonthComparison()).isNull();
    }

    @Test
    void previousMonthComparisonComputesExpenseDeltaWhenPreviousHasData() {
        statisticsService = service();
        YearMonth month = YearMonth.of(2024, 5);
        when(budgetRepository.findByMonthAndYear(5, 2024)).thenReturn(Optional.empty());
        when(expenseRepository.findByDateBetween(month.atDay(1), month.atEndOfMonth())).thenReturn(
                List.of(expense(new BigDecimal("90.00"), LocalDate.of(2024, 5, 2), food)));
        when(expenseRepository.findByDateBetween(YearMonth.of(2024, 4).atDay(1), YearMonth.of(2024, 4).atEndOfMonth()))
                .thenReturn(List.of(expense(new BigDecimal("100.00"), LocalDate.of(2024, 4, 2), food)));

        StatisticsResponse stats = statisticsService.getStatistics(5, 2024);

        assertThat(stats.previousMonthComparison()).isNotNull();
        assertThat(stats.previousMonthComparison().expenseDeltaPercentage()).isEqualByComparingTo("-10.00");
    }

    @Test
    void aFutureMonthConsidersZeroDaysAndHasNoDailyData() {
        statisticsService = service();
        YearMonth futureMonth = YearMonth.from(LocalDate.now()).plusMonths(6);
        when(budgetRepository.findByMonthAndYear(futureMonth.getMonthValue(), futureMonth.getYear()))
                .thenReturn(Optional.empty());
        when(expenseRepository.findByDateBetween(any(), any())).thenReturn(List.of());

        StatisticsResponse stats = statisticsService.getStatistics(futureMonth.getMonthValue(), futureMonth.getYear());

        assertThat(stats.daysConsidered()).isZero();
        assertThat(stats.dailySpending()).isEmpty();
        assertThat(stats.highestSpendingDay()).isNull();
        assertThat(stats.averageDailyExpense()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void spendingPaceIsAheadWhenPercentageUsedClearlyExceedsPeriodElapsed() {
        statisticsService = service();
        LocalDate now = LocalDate.now();
        YearMonth currentMonth = YearMonth.from(now);
        int daysInMonth = currentMonth.lengthOfMonth();
        // budgetAmount = daysInMonth hace que percentageUsed = gasto*100/daysInMonth: con
        // gasto = diasTranscurridos + 20 queda siempre >5 puntos por encima de
        // percentageElapsed = diasTranscurridos*100/daysInMonth, sea cual sea el día real de hoy.
        BigDecimal budgetAmount = BigDecimal.valueOf(daysInMonth);
        BigDecimal expenseAmount = BigDecimal.valueOf(now.getDayOfMonth() + 20);

        when(budgetRepository.findByMonthAndYear(currentMonth.getMonthValue(), currentMonth.getYear()))
                .thenReturn(Optional.of(Budget.builder().id(1L)
                        .month(currentMonth.getMonthValue()).year(currentMonth.getYear())
                        .amount(budgetAmount).build()));
        when(expenseRepository.findByDateBetween(any(), any())).thenReturn(List.of());
        when(expenseRepository.findByDateBetween(currentMonth.atDay(1), currentMonth.atEndOfMonth()))
                .thenReturn(List.of(expense(expenseAmount, currentMonth.atDay(1), food)));

        StatisticsResponse stats = statisticsService.getStatistics(currentMonth.getMonthValue(), currentMonth.getYear());

        assertThat(stats.spendingPace()).isNotNull();
        assertThat(stats.spendingPace().status()).isEqualTo(SpendingPaceStatus.AHEAD);
    }
}
