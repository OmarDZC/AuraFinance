package com.aura.finance.dto.budget;

import java.math.BigDecimal;

public record BudgetResponse(
        Long id,
        Integer month,
        Integer year,
        BigDecimal amount
) {
}
