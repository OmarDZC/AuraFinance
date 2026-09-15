import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, LOCALE_ID, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of, throwError } from 'rxjs';

import { ApiError } from '../../core/models/api-error.model';
import { Budget, BudgetRequest } from '../../core/models/budget.model';
import { Expense, ExpenseRequest } from '../../core/models/expense.model';
import { MonthlySummary } from '../../core/models/monthly-summary.model';
import { BudgetService } from '../../core/services/budget.service';
import { ExpenseService } from '../../core/services/expense.service';
import { SummaryService } from '../../core/services/summary.service';
import { previousPeriodOf, PeriodStore } from '../../core/state/period.store';
import { BadgePill } from '../../shared/ui/badge-pill/badge-pill';
import { CircularGauge } from '../../shared/ui/circular-gauge/circular-gauge';
import { GlassCard } from '../../shared/ui/glass-card/glass-card';
import { ProgressBar } from '../../shared/ui/progress-bar/progress-bar';
import { StatTile } from '../../shared/ui/stat-tile/stat-tile';

import { BudgetForm } from '../budgets/components/budget-form/budget-form';
import { ExpenseForm } from '../expenses/components/expense-form/expense-form';

interface CategorySlice {
  name: string;
  total: number;
  percentage: number;
}

interface DaySlice {
  day: number;
  total: number;
}

function sumAmounts(expenses: Expense[]): number {
  return expenses.reduce((acc, e) => acc + e.amount, 0);
}

function groupByCategory(expenses: Expense[]): CategorySlice[] {
  const totals = new Map<string, number>();
  for (const e of expenses) {
    totals.set(e.category.name, (totals.get(e.category.name) ?? 0) + e.amount);
  }
  const grandTotal = sumAmounts(expenses);
  return Array.from(totals.entries())
    .map(([name, total]) => ({ name, total, percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0 }))
    .sort((a, b) => b.total - a.total);
}

function groupByDay(expenses: Expense[], daysInMonth: number): DaySlice[] {
  const totals = new Array<number>(daysInMonth).fill(0);
  for (const e of expenses) {
    const day = Number(e.date.slice(8, 10));
    if (day >= 1 && day <= daysInMonth) {
      totals[day - 1] += e.amount;
    }
  }
  return totals.map((total, idx) => ({ day: idx + 1, total }));
}

/**
 * Dashboard: pantalla principal, con datos reales del backend para el
 * periodo seleccionado (PeriodStore, compartido con Topbar/Budget/Expenses).
 *
 * Es también el centro de acción de la app: el botón flotante "+" reutiliza
 * el mismo ExpenseForm que la página Expenses (mismo componente, sin
 * duplicar formulario) para poder añadir un movimiento sin salir del
 * Dashboard; al guardar, se recarga inmediatamente.
 *
 * Todo lo derivado (desglose por categoría, evolución diaria, comparación
 * con el mes anterior) se calcula en el cliente filtrando por `type` los
 * movimientos ya cargados — no requiere un presupuesto configurado y
 * distingue explícitamente gastos de ingresos:
 * - "gastado", desglose por categoría y evolución diaria: solo EXPENSE.
 * - "ingresos": solo INCOME.
 * Las cifras que sí dependen de un presupuesto (restante, % usado, límite
 * diario) se degradan con elegancia a un aviso "sin presupuesto" cuando
 * /api/budgets/summary devuelve 404 para el periodo, sin bloquear el resto
 * de la pantalla.
 *
 * El presupuesto también se crea/edita desde aquí (icono junto a la cifra
 * "Presupuesto", reutilizando BudgetForm — el mismo componente que usa la
 * página interna /budget): por eso este componente también conoce
 * BudgetService y mantiene su propia lista de presupuestos, igual que hace
 * Budgets, para poder resolver el `id` a actualizar (el summary no lo trae).
 */
@Component({
  selector: 'aura-dashboard',
  imports: [
    GlassCard,
    StatTile,
    CircularGauge,
    ProgressBar,
    BadgePill,
    RouterLink,
    DecimalPipe,
    ExpenseForm,
    BudgetForm,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly expenseService = inject(ExpenseService);
  private readonly summaryService = inject(SummaryService);
  private readonly budgetService = inject(BudgetService);
  protected readonly period = inject(PeriodStore);

  private readonly locale = inject(LOCALE_ID);
  private readonly currencyPipe = new CurrencyPipe(this.locale);
  private readonly datePipe = new DatePipe(this.locale);

  protected readonly loading = signal(false);
  protected readonly error = signal<ApiError | null>(null);

  protected readonly summary = signal<MonthlySummary | null>(null);
  protected readonly currentMovements = signal<Expense[]>([]);
  protected readonly previousMovements = signal<Expense[]>([]);

  protected readonly hasBudget = computed(() => this.summary() !== null);

  // --- Gastos e ingresos, siempre separados por `type` ---
  protected readonly currentExpensesOnly = computed(() =>
    this.currentMovements().filter((m) => m.type === 'EXPENSE'),
  );
  protected readonly currentIncomeOnly = computed(() =>
    this.currentMovements().filter((m) => m.type === 'INCOME'),
  );
  protected readonly previousExpensesOnly = computed(() =>
    this.previousMovements().filter((m) => m.type === 'EXPENSE'),
  );

  protected readonly totalSpent = computed(() => sumAmounts(this.currentExpensesOnly()));
  protected readonly totalIncome = computed(() => sumAmounts(this.currentIncomeOnly()));
  protected readonly previousTotalSpent = computed(() => sumAmounts(this.previousExpensesOnly()));

  protected readonly categoryBreakdown = computed(() => groupByCategory(this.currentExpensesOnly()));

  protected readonly dailyBreakdown = computed(() =>
    groupByDay(this.currentExpensesOnly(), this.period.daysInMonth()),
  );
  protected readonly maxDailyTotal = computed(() =>
    Math.max(1, ...this.dailyBreakdown().map((d) => d.total)),
  );
  protected readonly today = new Date().getDate();

  /** Los 5 movimientos más recientes, gastos e ingresos mezclados. */
  protected readonly recentMovements = computed(() =>
    [...this.currentMovements()]
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id))
      .slice(0, 5),
  );

  /** null si no hay gasto real del mes anterior con el que comparar. */
  protected readonly monthComparison = computed(() => {
    const prevTotal = this.previousTotalSpent();
    const currTotal = this.totalSpent();
    if (prevTotal <= 0) {
      return null;
    }
    return { prevTotal, deltaPercentage: ((currTotal - prevTotal) / prevTotal) * 100 };
  });

  /** Solo tiene sentido para el mes real en curso, con presupuesto configurado. */
  protected readonly dailyLimit = computed(() => {
    if (!this.period.isCurrentPeriod()) {
      return null;
    }
    const s = this.summary();
    if (!s) {
      return null;
    }
    const daysRemaining = this.period.daysInMonth() - this.today + 1;
    return daysRemaining > 0 ? s.remaining / daysRemaining : null;
  });

  // --- Botón flotante "+" → mismo ExpenseForm que Expenses ---
  protected readonly isFormOpen = signal(false);
  protected readonly formError = signal<ApiError | null>(null);
  protected readonly saving = signal(false);

  // --- Editar/crear presupuesto in-situ → mismo BudgetForm que /budget ---
  protected readonly budgets = signal<Budget[]>([]);
  protected readonly currentBudgetEntity = computed<Budget | null>(
    () =>
      this.budgets().find((b) => b.month === this.period.month() && b.year === this.period.year()) ??
      null,
  );
  protected readonly isBudgetFormOpen = signal(false);
  protected readonly budgetFormError = signal<ApiError | null>(null);
  protected readonly savingBudget = signal(false);

  constructor() {
    effect(() => {
      this.period.month();
      this.period.year();
      this.loadDashboard();
    });
  }

  protected loadDashboard(): void {
    const month = this.period.month();
    const year = this.period.year();
    const prev = previousPeriodOf(month, year);

    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      current: this.expenseService.getAll({ month, year }),
      previous: this.expenseService.getAll({ month: prev.month, year: prev.year }),
      budgets: this.budgetService.getAll(),
      summary: this.summaryService.getMonthlySummary(month, year).pipe(
        catchError((err: ApiError) => (err.status === 404 ? of(null) : throwError(() => err))),
      ),
    }).subscribe({
      next: ({ current, previous, budgets, summary }) => {
        this.currentMovements.set(current);
        this.previousMovements.set(previous);
        this.budgets.set(budgets);
        this.summary.set(summary);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err);
        this.loading.set(false);
      },
    });
  }

  protected formatCurrency(value: number): string {
    return this.currencyPipe.transform(value, 'EUR') ?? `${value.toFixed(2)} €`;
  }

  protected formatDate(value: string): string {
    return this.datePipe.transform(value, 'dd MMM') ?? value;
  }

  /** Altura visual de la barra diaria (%), con un mínimo visible para días sin gasto. */
  protected barHeightPercent(total: number): number {
    if (total <= 0) {
      return 4;
    }
    return Math.max(6, (total / this.maxDailyTotal()) * 100);
  }

  protected openAddMovement(): void {
    this.formError.set(null);
    this.isFormOpen.set(true);
  }

  protected closeForm(): void {
    this.isFormOpen.set(false);
    this.formError.set(null);
  }

  protected onSave(request: ExpenseRequest): void {
    this.saving.set(true);
    this.formError.set(null);
    this.expenseService.create(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadDashboard();
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.formError.set(err);
      },
    });
  }

  protected openBudgetForm(): void {
    this.budgetFormError.set(null);
    this.isBudgetFormOpen.set(true);
  }

  protected closeBudgetForm(): void {
    this.isBudgetFormOpen.set(false);
    this.budgetFormError.set(null);
  }

  protected onSaveBudget(amount: number): void {
    const request: BudgetRequest = { month: this.period.month(), year: this.period.year(), amount };
    const existing = this.currentBudgetEntity();

    this.savingBudget.set(true);
    this.budgetFormError.set(null);
    const operation = existing
      ? this.budgetService.update(existing.id, request)
      : this.budgetService.create(request);

    operation.subscribe({
      next: () => {
        this.savingBudget.set(false);
        this.closeBudgetForm();
        this.loadDashboard();
      },
      error: (err: ApiError) => {
        this.savingBudget.set(false);
        this.budgetFormError.set(err);
      },
    });
  }
}
