package com.aura.finance.service;

import com.aura.finance.dto.category.CategoryResponse;
import com.aura.finance.dto.statistics.CategoryBreakdownItem;
import com.aura.finance.dto.statistics.DailySpendingPoint;
import com.aura.finance.dto.statistics.HighestSpendingDayResponse;
import com.aura.finance.dto.statistics.PreviousMonthComparisonResponse;
import com.aura.finance.dto.statistics.SpendingPaceResponse;
import com.aura.finance.dto.statistics.SpendingPaceStatus;
import com.aura.finance.dto.statistics.StatisticsResponse;
import com.aura.finance.entity.Budget;
import com.aura.finance.entity.Category;
import com.aura.finance.entity.Expense;
import com.aura.finance.entity.MovementType;
import com.aura.finance.repository.BudgetRepository;
import com.aura.finance.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Calcula todas las estadísticas de un periodo (mes/año) en una sola
 * llamada, a partir de BudgetRepository y ExpenseRepository. Vive en su
 * propio servicio (no reutiliza SummaryService) porque su forma de tratar
 * "sin presupuesto" es distinta: SummaryService lanza 404 (pensado para un
 * resumen que depende por completo del presupuesto), mientras que
 * Statistics debe seguir mostrando el resto de métricas (gastado, ingresos,
 * categorías, evolución diaria...) aunque no exista presupuesto ese mes.
 *
 * Reglas importantes, pedidas explícitamente por el negocio:
 * - Los ingresos (MovementType.INCOME) nunca cuentan como gasto: no entran
 *   en categoryBreakdown, dailySpending, highestSpendingDay,
 *   averageDailyExpense ni percentageUsed/spendingPace. Solo aparecen en
 *   totalIncome y en la comparación de ingresos con el mes anterior.
 * - "Días considerados" (para media diaria, ritmo de gasto y el límite del
 *   gráfico de evolución diaria): mes en curso -> días transcurridos hasta
 *   hoy inclusive; mes pasado -> todos los días del mes; mes futuro -> 0
 *   (no se inventan datos que aún no existen). `totalExpenses`/`totalIncome`
 *   (y por tanto `remaining`/`percentageUsed`) SÍ sirven para el mes
 *   completo en todos los casos, igual que en SummaryService: son cifras ya
 *   establecidas en el resto de la app (Dashboard, Presupuesto) y deben
 *   coincidir con lo que muestran esas pantallas.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatisticsService {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    /** Diferencia (en puntos porcentuales) por debajo de la cual el ritmo se considera "a la par". */
    private static final BigDecimal PACE_TOLERANCE_POINTS = BigDecimal.valueOf(5);

    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;

    public StatisticsResponse getStatistics(Integer month, Integer year) {
        LocalDate now = LocalDate.now();
        int targetMonth = (month != null) ? month : now.getMonthValue();
        int targetYear = (year != null) ? year : now.getYear();

        YearMonth yearMonth = YearMonth.of(targetYear, targetMonth);
        LocalDate start = yearMonth.atDay(1);
        LocalDate end = yearMonth.atEndOfMonth();
        int daysInMonth = yearMonth.lengthOfMonth();
        int daysConsidered = resolveDaysConsidered(yearMonth, now, daysInMonth);

        List<Expense> movements = expenseRepository.findByDateBetween(start, end);
        List<Expense> expenses = movements.stream().filter(e -> e.getType() == MovementType.EXPENSE).toList();
        List<Expense> incomes = movements.stream().filter(e -> e.getType() == MovementType.INCOME).toList();
        List<Expense> consideredExpenses = expenses.stream()
                .filter(e -> e.getDate().getDayOfMonth() <= daysConsidered)
                .toList();

        BigDecimal totalExpenses = sum(expenses);
        BigDecimal totalIncome = sum(incomes);

        Budget budget = budgetRepository.findByMonthAndYear(targetMonth, targetYear).orElse(null);
        boolean hasBudget = budget != null;
        BigDecimal budgetAmount = hasBudget ? budget.getAmount() : null;
        BigDecimal remaining = hasBudget ? budgetAmount.subtract(totalExpenses) : null;
        BigDecimal percentageUsed = hasBudget ? percentageOf(totalExpenses, budgetAmount) : null;

        BigDecimal averageDailyExpense = daysConsidered > 0
                ? sum(consideredExpenses).divide(BigDecimal.valueOf(daysConsidered), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        List<CategoryBreakdownItem> categoryBreakdown = buildCategoryBreakdown(expenses, totalExpenses);
        CategoryBreakdownItem highestSpendingCategory = categoryBreakdown.isEmpty() ? null : categoryBreakdown.get(0);
        HighestSpendingDayResponse highestSpendingDay = findHighestSpendingDay(consideredExpenses);
        List<DailySpendingPoint> dailySpending = buildDailySpending(consideredExpenses, daysConsidered);

        PreviousMonthComparisonResponse comparison =
                buildPreviousMonthComparison(targetMonth, targetYear, totalExpenses, totalIncome);

        SpendingPaceResponse spendingPace = hasBudget
                ? buildSpendingPace(percentageUsed, daysConsidered, daysInMonth)
                : null;

        int expenseCount = expenses.size();
        int daysWithExpense = (int) consideredExpenses.stream().map(Expense::getDate).distinct().count();
        BigDecimal averageExpensePerMovement = expenseCount > 0
                ? totalExpenses.divide(BigDecimal.valueOf(expenseCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return new StatisticsResponse(
                targetMonth,
                targetYear,
                hasBudget,
                budgetAmount,
                totalExpenses,
                totalIncome,
                remaining,
                percentageUsed,
                averageDailyExpense,
                daysConsidered,
                highestSpendingDay,
                highestSpendingCategory,
                categoryBreakdown,
                dailySpending,
                comparison,
                spendingPace,
                expenseCount,
                incomes.size(),
                daysWithExpense,
                averageExpensePerMovement
        );
    }

    /**
     * Mes pasado -> todos sus días (ya se conoce el mes completo).
     * Mes actual -> solo hasta hoy (no se inventan gastos de días futuros).
     * Mes futuro -> 0 (todavía no ha empezado).
     */
    private int resolveDaysConsidered(YearMonth target, LocalDate now, int daysInMonth) {
        YearMonth current = YearMonth.from(now);
        if (target.isBefore(current)) {
            return daysInMonth;
        }
        if (target.equals(current)) {
            return now.getDayOfMonth();
        }
        return 0;
    }

    private List<CategoryBreakdownItem> buildCategoryBreakdown(List<Expense> expenses, BigDecimal totalExpenses) {
        // Se agrupa por id de categoría (no por la entidad) para no depender de que
        // Hibernate devuelva la misma instancia para el mismo id dentro de la sesión.
        Map<Long, CategoryResponse> categoriesById = new LinkedHashMap<>();
        Map<Long, BigDecimal> totalsByCategoryId = new LinkedHashMap<>();
        for (Expense expense : expenses) {
            Category category = expense.getCategory();
            categoriesById.putIfAbsent(category.getId(), new CategoryResponse(category.getId(), category.getName()));
            totalsByCategoryId.merge(category.getId(), expense.getAmount(), BigDecimal::add);
        }

        return totalsByCategoryId.entrySet().stream()
                .map(entry -> new CategoryBreakdownItem(
                        categoriesById.get(entry.getKey()),
                        entry.getValue(),
                        percentageOf(entry.getValue(), totalExpenses)))
                .sorted(Comparator.comparing(CategoryBreakdownItem::amount).reversed())
                .toList();
    }

    private HighestSpendingDayResponse findHighestSpendingDay(List<Expense> expenses) {
        Map<LocalDate, BigDecimal> totalsByDate = new LinkedHashMap<>();
        for (Expense expense : expenses) {
            totalsByDate.merge(expense.getDate(), expense.getAmount(), BigDecimal::add);
        }

        return totalsByDate.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(entry -> new HighestSpendingDayResponse(entry.getKey(), entry.getValue()))
                .orElse(null);
    }

    private List<DailySpendingPoint> buildDailySpending(List<Expense> expenses, int daysConsidered) {
        BigDecimal[] totalsByDay = new BigDecimal[daysConsidered];
        for (int i = 0; i < daysConsidered; i++) {
            totalsByDay[i] = BigDecimal.ZERO;
        }
        for (Expense expense : expenses) {
            int index = expense.getDate().getDayOfMonth() - 1;
            totalsByDay[index] = totalsByDay[index].add(expense.getAmount());
        }

        List<DailySpendingPoint> points = new java.util.ArrayList<>(daysConsidered);
        BigDecimal cumulative = BigDecimal.ZERO;
        for (int i = 0; i < daysConsidered; i++) {
            cumulative = cumulative.add(totalsByDay[i]);
            points.add(new DailySpendingPoint(i + 1, totalsByDay[i], cumulative));
        }
        return points;
    }

    private PreviousMonthComparisonResponse buildPreviousMonthComparison(
            int month, int year, BigDecimal currentTotalExpenses, BigDecimal currentTotalIncome) {
        YearMonth previous = YearMonth.of(year, month).minusMonths(1);
        LocalDate start = previous.atDay(1);
        LocalDate end = previous.atEndOfMonth();

        List<Expense> previousMovements = expenseRepository.findByDateBetween(start, end);
        BigDecimal previousTotalExpenses = sum(
                previousMovements.stream().filter(e -> e.getType() == MovementType.EXPENSE).toList());
        BigDecimal previousTotalIncome = sum(
                previousMovements.stream().filter(e -> e.getType() == MovementType.INCOME).toList());

        if (previousTotalExpenses.compareTo(BigDecimal.ZERO) <= 0) {
            // Sin gasto real el mes anterior: no hay base para comparar, no se inventa un valor.
            return null;
        }

        BigDecimal expenseDelta = currentTotalExpenses.subtract(previousTotalExpenses)
                .multiply(HUNDRED)
                .divide(previousTotalExpenses, 2, RoundingMode.HALF_UP);

        BigDecimal incomeDelta = previousTotalIncome.compareTo(BigDecimal.ZERO) > 0
                ? currentTotalIncome.subtract(previousTotalIncome)
                        .multiply(HUNDRED)
                        .divide(previousTotalIncome, 2, RoundingMode.HALF_UP)
                : null;

        return new PreviousMonthComparisonResponse(
                previous.getMonthValue(),
                previous.getYear(),
                previousTotalExpenses,
                currentTotalExpenses,
                expenseDelta,
                previousTotalIncome,
                currentTotalIncome,
                incomeDelta
        );
    }

    private SpendingPaceResponse buildSpendingPace(BigDecimal percentageUsed, int daysConsidered, int daysInMonth) {
        BigDecimal percentageElapsed = daysInMonth > 0
                ? BigDecimal.valueOf(daysConsidered)
                        .multiply(HUNDRED)
                        .divide(BigDecimal.valueOf(daysInMonth), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal difference = percentageUsed.subtract(percentageElapsed);
        SpendingPaceStatus status;
        if (difference.compareTo(PACE_TOLERANCE_POINTS) > 0) {
            status = SpendingPaceStatus.AHEAD;
        } else if (difference.compareTo(PACE_TOLERANCE_POINTS.negate()) < 0) {
            status = SpendingPaceStatus.BEHIND;
        } else {
            status = SpendingPaceStatus.ON_TRACK;
        }

        return new SpendingPaceResponse(percentageUsed, percentageElapsed, status);
    }

    private BigDecimal percentageOf(BigDecimal numerator, BigDecimal denominator) {
        if (denominator == null || denominator.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return numerator.multiply(HUNDRED).divide(denominator, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal sum(List<Expense> expenses) {
        return expenses.stream().map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
