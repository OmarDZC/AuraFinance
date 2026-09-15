package com.aura.finance.repository;

import com.aura.finance.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByDateBetween(LocalDate start, LocalDate end);

    List<Expense> findByDateBetweenAndCategoryId(LocalDate start, LocalDate end, Long categoryId);

    List<Expense> findByCategoryId(Long categoryId);

    boolean existsByCategoryId(Long categoryId);

    @Query("select coalesce(sum(e.amount), 0) from Expense e where e.date between :start and :end")
    BigDecimal sumAmountByDateBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
