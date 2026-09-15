package com.aura.finance.dto.statistics;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Día con mayor gasto (solo EXPENSE) dentro del periodo considerado. */
public record HighestSpendingDayResponse(
        LocalDate date,
        BigDecimal amount
) {
}
