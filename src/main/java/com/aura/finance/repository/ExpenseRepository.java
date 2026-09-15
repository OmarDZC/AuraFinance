package com.aura.finance.repository;

import com.aura.finance.entity.Expense;
import com.aura.finance.entity.MovementType;
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

    /** Suma solo los movimientos del tipo indicado (EXPENSE o INCOME) en el rango de fechas. */
    @Query("select coalesce(sum(e.amount), 0) from Expense e where e.type = :type and e.date between :start and :end")
    BigDecimal sumAmountByTypeAndDateBetween(
            @Param("type") MovementType type, @Param("start") LocalDate start, @Param("end") LocalDate end);
}
