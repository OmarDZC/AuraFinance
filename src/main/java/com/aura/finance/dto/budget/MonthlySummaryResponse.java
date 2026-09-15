package com.aura.finance.dto.budget;

import java.math.BigDecimal;

/**
 * Resumen mensual: presupuesto, total gastado, total ingresado, restante
 * (presupuesto - gastado; los ingresos no afectan a esta cifra) y porcentaje
 * utilizado del presupuesto.
 */
public record MonthlySummaryResponse(
        Integer month,
        Integer year,
        BigDecimal budgetAmount,
        BigDecimal totalSpent,
        BigDecimal totalIncome,
        BigDecimal remaining,
        BigDecimal percentageUsed
) {
}
