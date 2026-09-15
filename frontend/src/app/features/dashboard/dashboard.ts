import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of, throwError } from 'rxjs';

import { ApiError } from '../../core/models/api-error.model';
import { Expense } from '../../core/models/expense.model';
import { MonthlySummary } from '../../core/models/monthly-summary.model';
import { ExpenseService } from '../../core/services/expense.service';
import { SummaryService } from '../../core/services/summary.service';
import { previousPeriodOf, PeriodStore } from '../../core/state/period.store';
import { BadgePill } from '../../shared/ui/badge-pill/badge-pill';
import { CircularGauge } from '../../shared/ui/circular-gauge/circular-gauge';
import { GlassCard } from '../../shared/ui/glass-card/glass-card';
import { ProgressBar } from '../../shared/ui/progress-bar/progress-bar';
import { StatTile } from '../../shared/ui/stat-tile/stat-tile';

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
 * Todo lo derivado (desglose por categoría, evolución diaria, comparación
 * con el mes anterior, total gastado) se calcula en el cliente a partir de
 * los gastos reales — no requiere un presupuesto configurado. Las cifras
 * que sí dependen de un presupuesto (restante, % usado, límite diario) se
 * degradan con elegancia a un aviso "sin presupuesto" cuando
 * /api/budgets/summary devuelve 404 para el periodo, sin bloquear el resto
 * de la pantalla.
 */
@Component({
  selector: 'aura-dashboard',
  imports: [GlassCard, StatTile, CircularGauge, ProgressBar, BadgePill, RouterLink, DecimalPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly expenseService = inject(ExpenseService);
  private readonly summaryService = inject(SummaryService);
  protected readonly period = inject(PeriodStore);

  private readonly currencyPipe = new CurrencyPipe('en-US');
  private readonly datePipe = new DatePipe('en-US');

  protected readonly loading = signal(false);
  protected readonly error = signal<ApiError | null>(null);

  protected readonly summary = signal<MonthlySummary | null>(null);
  protected readonly currentExpenses = signal<Expense[]>([]);
  protected readonly previousExpenses = signal<Expense[]>([]);

  protected readonly hasBudget = computed(() => this.summary() !== null);
  protected readonly totalSpent = computed(() => sumAmounts(this.currentExpenses()));
  protected readonly previousTotalSpent = computed(() => sumAmounts(this.previousExpenses()));

  protected readonly categoryBreakdown = computed(() => groupByCategory(this.currentExpenses()));

  protected readonly dailyBreakdown = computed(() =>
    groupByDay(this.currentExpenses(), this.period.daysInMonth()),
  );
  protected readonly maxDailyTotal = computed(() =>
    Math.max(1, ...this.dailyBreakdown().map((d) => d.total)),
  );
  protected readonly today = new Date().getDate();

  protected readonly recentExpenses = computed(() =>
    [...this.currentExpenses()]
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id))
      .slice(0, 5),
  );

  /** null si no hay datos reales del mes anterior con los que comparar. */
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
      summary: this.summaryService.getMonthlySummary(month, year).pipe(
        catchError((err: ApiError) => (err.status === 404 ? of(null) : throwError(() => err))),
      ),
    }).subscribe({
      next: ({ current, previous, summary }) => {
        this.currentExpenses.set(current);
        this.previousExpenses.set(previous);
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
    return this.currencyPipe.transform(value, 'EUR') ?? `€${value.toFixed(2)}`;
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
}
