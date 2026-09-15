package com.aura.finance.dto.statistics;

import java.math.BigDecimal;

/**
 * Comparación con el mes anterior. Solo se construye (no-null) cuando el mes
 * anterior tiene gasto real registrado; si no, no hay base para comparar y
 * StatisticsService devuelve null en su lugar ("sin datos suficientes"),
 * nunca un valor inventado.
 *
 * `incomeDeltaPercentage` puede ser null aunque el resto de campos no lo
 * sean: la comparación de ingresos es secundaria y solo tiene sentido si
 * también hubo ingresos reales el mes anterior.
 */
public record PreviousMonthComparisonResponse(
        Integer previousMonth,
        Integer previousYear,
        BigDecimal previousTotalExpenses,
        BigDecimal currentTotalExpenses,
        BigDecimal expenseDeltaPercentage,
        BigDecimal previousTotalIncome,
        BigDecimal currentTotalIncome,
        BigDecimal incomeDeltaPercentage
) {
}
