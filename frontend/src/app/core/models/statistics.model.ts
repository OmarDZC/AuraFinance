import { Category } from './category.model';

/**
 * Refleja com.aura.finance.dto.statistics.* (backend). Todo lo que muestra
 * la pantalla de Estadísticas llega ya calculado desde StatisticsService:
 * este modelo no debe usarse para recalcular cifras financieras en Angular,
 * solo para darles formato/presentación.
 *
 * `hasBudget` es la guarda de todos los campos que dependen de un
 * presupuesto (`budgetAmount`, `remaining`, `percentageUsed`,
 * `spendingPace`): si es `false`, esos campos llegan como `null`.
 */
export interface StatisticsResponse {
  month: number;
  year: number;
  hasBudget: boolean;
  budgetAmount: number | null;
  totalExpenses: number;
  totalIncome: number;
  remaining: number | null;
  percentageUsed: number | null;
  averageDailyExpense: number;
  daysConsidered: number;
  highestSpendingDay: HighestSpendingDay | null;
  highestSpendingCategory: CategoryBreakdownItem | null;
  categoryBreakdown: CategoryBreakdownItem[];
  dailySpending: DailySpendingPoint[];
  previousMonthComparison: PreviousMonthComparison | null;
  spendingPace: SpendingPace | null;
  expenseCount: number;
  incomeCount: number;
  daysWithExpense: number;
  averageExpensePerMovement: number;
}

export interface HighestSpendingDay {
  date: string;
  amount: number;
}

export interface CategoryBreakdownItem {
  category: Category;
  amount: number;
  percentage: number;
}

export interface DailySpendingPoint {
  day: number;
  amount: number;
  cumulativeAmount: number;
}

/** Solo existe cuando el mes anterior tiene gasto real: si no, es `null` ("sin datos suficientes"). */
export interface PreviousMonthComparison {
  previousMonth: number;
  previousYear: number;
  previousTotalExpenses: number;
  currentTotalExpenses: number;
  expenseDeltaPercentage: number;
  previousTotalIncome: number;
  currentTotalIncome: number;
  /** `null` si tampoco hubo ingresos el mes anterior: no hay base para comparar ingresos. */
  incomeDeltaPercentage: number | null;
}

export type SpendingPaceStatus = 'AHEAD' | 'ON_TRACK' | 'BEHIND';

/** Solo existe cuando hay presupuesto configurado para el periodo. */
export interface SpendingPace {
  percentageBudgetUsed: number;
  percentagePeriodElapsed: number;
  status: SpendingPaceStatus;
}
