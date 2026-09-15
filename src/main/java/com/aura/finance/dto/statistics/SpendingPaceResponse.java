package com.aura.finance.dto.statistics;

import java.math.BigDecimal;

/**
 * Ritmo de gasto: % de presupuesto gastado frente a % del periodo
 * transcurrido. Solo se calcula cuando hay presupuesto configurado (sin
 * presupuesto no hay "% gastado" con el que comparar).
 */
public record SpendingPaceResponse(
        BigDecimal percentageBudgetUsed,
        BigDecimal percentagePeriodElapsed,
        SpendingPaceStatus status
) {
}
