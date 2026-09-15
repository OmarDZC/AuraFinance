package com.aura.finance.service;

import com.aura.finance.dto.budget.MonthlySummaryResponse;
import com.aura.finance.entity.Budget;
import com.aura.finance.entity.MovementType;
import com.aura.finance.exception.ResourceNotFoundException;
import com.aura.finance.repository.BudgetRepository;
import com.aura.finance.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;

/**
 * Calcula el resumen mensual (presupuesto, gastado, ingresado, restante, %
 * usado). Combina BudgetRepository y ExpenseRepository, por eso vive en un
 * servicio propio en lugar de en BudgetService o ExpenseService (evita
 * dependencias cruzadas entre ambos).
 *
 * `remaining` y `percentageUsed` se calculan solo a partir de los
 * movimientos de tipo EXPENSE: los ingresos son una cifra informativa aparte
 * y no alteran el consumo del presupuesto de gasto.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SummaryService {

    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;

    public MonthlySummaryResponse getMonthlySummary(Integer month, Integer year) {
        LocalDate now = LocalDate.now();
        int targetMonth = (month != null) ? month : now.getMonthValue();
        int targetYear = (year != null) ? year : now.getYear();

        Budget budget = budgetRepository.findByMonthAndYear(targetMonth, targetYear)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No hay presupuesto configurado para " + targetMonth + "/" + targetYear));

        YearMonth yearMonth = YearMonth.of(targetYear, targetMonth);
        LocalDate start = yearMonth.atDay(1);
        LocalDate end = yearMonth.atEndOfMonth();

        BigDecimal totalSpent = expenseRepository.sumAmountByTypeAndDateBetween(MovementType.EXPENSE, start, end);
        BigDecimal totalIncome = expenseRepository.sumAmountByTypeAndDateBetween(MovementType.INCOME, start, end);

        BigDecimal budgetAmount = budget.getAmount();
        BigDecimal remaining = budgetAmount.subtract(totalSpent);
        BigDecimal percentageUsed = calculatePercentageUsed(budgetAmount, totalSpent);

        return new MonthlySummaryResponse(
                targetMonth, targetYear, budgetAmount, totalSpent, totalIncome, remaining, percentageUsed);
    }

    private BigDecimal calculatePercentageUsed(BigDecimal budgetAmount, BigDecimal totalSpent) {
        if (budgetAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return totalSpent
                .multiply(BigDecimal.valueOf(100))
                .divide(budgetAmount, 2, RoundingMode.HALF_UP);
    }
}
