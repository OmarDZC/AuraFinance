package com.aura.finance.dto.statistics;

import java.math.BigDecimal;

/**
 * Gasto (solo EXPENSE) de un día concreto del periodo, junto con el
 * acumulado desde el día 1 hasta ese día inclusive. Se calculan juntos para
 * no obligar al frontend a acumular importes en coma flotante.
 */
public record DailySpendingPoint(
        int day,
        BigDecimal amount,
        BigDecimal cumulativeAmount
) {
}
