package com.aura.finance.dto.statistics;

import com.aura.finance.dto.category.CategoryResponse;

import java.math.BigDecimal;

/**
 * Gasto total de una categoría dentro del periodo y su peso sobre el total
 * gastado (solo EXPENSE; los ingresos nunca aparecen aquí). `percentage` es
 * siempre relativo al total gastado del periodo, nunca al presupuesto.
 */
public record CategoryBreakdownItem(
        CategoryResponse category,
        BigDecimal amount,
        BigDecimal percentage
) {
}
