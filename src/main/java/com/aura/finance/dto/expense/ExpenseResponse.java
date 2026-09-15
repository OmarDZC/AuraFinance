package com.aura.finance.dto.expense;

import com.aura.finance.dto.category.CategoryResponse;
import com.aura.finance.entity.MovementType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseResponse(
        Long id,
        MovementType type,
        BigDecimal amount,
        LocalDate date,
        String description,
        CategoryResponse category
) {
}
