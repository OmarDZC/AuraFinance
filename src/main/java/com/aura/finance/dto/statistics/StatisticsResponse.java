package com.aura.finance.dto.statistics;

import java.math.BigDecimal;
import java.util.List;

/**
 * Respuesta completa de GET /api/statistics?month=&year=. Agrega, en una
 * sola llamada, todo lo que necesita la pantalla de Estadísticas para no
 * obligar al frontend a hacer varias peticiones ni a recalcular cifras
 * financieras importantes en Angular.
 *
 * `hasBudget` es la guarda para todos los campos que dependen de un
 * presupuesto (`budgetAmount`, `remaining`, `percentageUsed`,
 * `spendingPace`): si es false, esos campos llegan a null y el frontend
 * debe mostrar un estado "sin presupuesto" en su lugar, nunca inventar un 0.
 */
public record StatisticsResponse(
        Integer month,
        Integer year,
        boolean hasBudget,
        BigDecimal budgetAmount,
        BigDecimal totalExpenses,
        BigDecimal totalIncome,
        BigDecimal remaining,
        BigDecimal percentageUsed,
        BigDecimal averageDailyExpense,
        int daysConsidered,
        HighestSpendingDayResponse highestSpendingDay,
        CategoryBreakdownItem highestSpendingCategory,
        List<CategoryBreakdownItem> categoryBreakdown,
        List<DailySpendingPoint> dailySpending,
        PreviousMonthComparisonResponse previousMonthComparison,
        SpendingPaceResponse spendingPace,
        int expenseCount,
        int incomeCount,
        int daysWithExpense,
        BigDecimal averageExpensePerMovement
) {
}
