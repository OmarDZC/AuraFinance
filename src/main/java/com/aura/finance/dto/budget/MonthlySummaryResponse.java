package com.aura.finance.dto.budget;

import java.math.BigDecimal;

/**
 * Resumen mensual: presupuesto, total gastado, restante y porcentaje utilizado.
 */
public record MonthlySummaryResponse(
        Integer month,
        Integer year,
        BigDecimal budgetAmount,
        BigDecimal totalSpent,
        BigDecimal remaining,
        BigDecimal percentageUsed
) {
}
