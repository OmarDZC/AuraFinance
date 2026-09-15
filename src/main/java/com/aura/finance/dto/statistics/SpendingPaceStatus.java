package com.aura.finance.dto.statistics;

/**
 * Resultado de comparar el % de presupuesto gastado con el % del periodo
 * transcurrido (ver StatisticsService.buildSpendingPace). Una comparación
 * puramente aritmética, sin ningún tipo de predicción.
 */
public enum SpendingPaceStatus {
    AHEAD,
    ON_TRACK,
    BEHIND
}
