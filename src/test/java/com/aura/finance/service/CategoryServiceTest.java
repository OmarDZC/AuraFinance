package com.aura.finance.service;

import com.aura.finance.dto.category.CategoryRequest;
import com.aura.finance.entity.Category;
import com.aura.finance.exception.DuplicateResourceException;
import com.aura.finance.exception.ResourceNotFoundException;
import com.aura.finance.repository.CategoryRepository;
import com.aura.finance.repository.ExpenseRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @InjectMocks
    private CategoryService categoryService;

    @Test
    void rejectsDuplicateCategoryNameIgnoringCase() {
        when(categoryRepository.existsByNameIgnoreCase("Comida")).thenReturn(true);

        assertThatThrownBy(() -> categoryService.create(new CategoryRequest("Comida")))
                .isInstanceOf(DuplicateResourceException.class);

        verify(categoryRepository, never()).save(any());
    }

    @Test
    void deleteThrowsNotFoundWhenCategoryDoesNotExist() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.delete(1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteRejectsCategoryWithAssociatedExpenses() {
        Category category = Category.builder().id(1L).name("Ocio").build();
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(expenseRepository.existsByCategoryId(1L)).thenReturn(true);

        assertThatThrownBy(() -> categoryService.delete(1L))
                .isInstanceOf(DuplicateResourceException.class);

        verify(categoryRepository, never()).delete(any());
    }
}
