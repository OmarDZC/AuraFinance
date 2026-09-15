package com.aura.finance.dto.expense;

import com.aura.finance.dto.category.CategoryResponse;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseResponse(
        Long id,
        BigDecimal amount,
        LocalDate date,
        String description,
        CategoryResponse category
) {
}
