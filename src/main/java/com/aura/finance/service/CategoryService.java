package com.aura.finance.service;

import com.aura.finance.dto.category.CategoryRequest;
import com.aura.finance.dto.category.CategoryResponse;
import com.aura.finance.entity.Category;
import com.aura.finance.exception.DuplicateResourceException;
import com.aura.finance.exception.ResourceNotFoundException;
import com.aura.finance.repository.CategoryRepository;
import com.aura.finance.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ExpenseRepository expenseRepository;

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.name())) {
            throw new DuplicateResourceException("Ya existe una categoría con el nombre '" + request.name() + "'");
        }

        Category category = Category.builder()
                .name(request.name())
                .build();

        return toResponse(categoryRepository.save(category));
    }

    public List<CategoryResponse> findAll() {
        return categoryRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void delete(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada con id " + id));

        if (expenseRepository.existsByCategoryId(id)) {
            throw new DuplicateResourceException("No se puede eliminar la categoría porque tiene gastos asociados");
        }

        categoryRepository.delete(category);
    }

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(category.getId(), category.getName());
    }
}
