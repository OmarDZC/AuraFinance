package com.aura.finance.service;

import com.aura.finance.dto.category.CategoryResponse;
import com.aura.finance.dto.expense.ExpenseRequest;
import com.aura.finance.dto.expense.ExpenseResponse;
import com.aura.finance.entity.Category;
import com.aura.finance.entity.Expense;
import com.aura.finance.exception.ResourceNotFoundException;
import com.aura.finance.repository.CategoryRepository;
import com.aura.finance.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
    public ExpenseResponse create(ExpenseRequest request) {
        Category category = findCategoryOrThrow(request.categoryId());

        Expense expense = Expense.builder()
                .type(request.type())
                .amount(request.amount())
                .date(request.date())
                .description(request.description())
                .category(category)
                .build();

        return toResponse(expenseRepository.save(expense));
    }

    @Transactional
    public ExpenseResponse update(Long id, ExpenseRequest request) {
        Expense expense = findExpenseOrThrow(id);
        Category category = findCategoryOrThrow(request.categoryId());

        expense.setType(request.type());
        expense.setAmount(request.amount());
        expense.setDate(request.date());
        expense.setDescription(request.description());
        expense.setCategory(category);

        return toResponse(expense);
    }

    public ExpenseResponse findById(Long id) {
        return toResponse(findExpenseOrThrow(id));
    }

    /**
     * Lista gastos con filtros opcionales. Si se indica mes y año, filtra por ese
     * periodo (cubre el caso "gastos del mes actual" pasando el mes/año actuales).
     */
    public List<ExpenseResponse> findAll(Integer month, Integer year, Long categoryId) {
        List<Expense> expenses;

        if (month != null && year != null) {
            YearMonth yearMonth = YearMonth.of(year, month);
            LocalDate start = yearMonth.atDay(1);
            LocalDate end = yearMonth.atEndOfMonth();
            expenses = (categoryId != null)
                    ? expenseRepository.findByDateBetweenAndCategoryId(start, end, categoryId)
                    : expenseRepository.findByDateBetween(start, end);
        } else if (categoryId != null) {
            expenses = expenseRepository.findByCategoryId(categoryId);
        } else {
            expenses = expenseRepository.findAll();
        }

        return expenses.stream().map(this::toResponse).toList();
    }

    @Transactional
    public void delete(Long id) {
        expenseRepository.delete(findExpenseOrThrow(id));
    }

    private Expense findExpenseOrThrow(Long id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gasto no encontrado con id " + id));
    }

    private Category findCategoryOrThrow(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada con id " + categoryId));
    }

    private ExpenseResponse toResponse(Expense expense) {
        Category category = expense.getCategory();
        CategoryResponse categoryResponse = new CategoryResponse(category.getId(), category.getName());

        return new ExpenseResponse(
                expense.getId(),
                expense.getType(),
                expense.getAmount(),
                expense.getDate(),
                expense.getDescription(),
                categoryResponse
        );
    }
}
