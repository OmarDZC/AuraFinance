package com.aura.finance.repository;

import com.aura.finance.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {

    Optional<Budget> findByMonthAndYear(Integer month, Integer year);

    boolean existsByMonthAndYear(Integer month, Integer year);
}
