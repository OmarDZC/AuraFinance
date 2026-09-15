import { CurrencyPipe } from '@angular/common';
import { Component, LOCALE_ID, computed, effect, inject, signal } from '@angular/core';

import { ApiError } from '../../core/models/api-error.model';
import { Budget, BudgetRequest } from '../../core/models/budget.model';
import { MonthlySummary } from '../../core/models/monthly-summary.model';
import { BudgetService } from '../../core/services/budget.service';
import { SummaryService } from '../../core/services/summary.service';
import { PeriodStore } from '../../core/state/period.store';
import { CircularGauge } from '../../shared/ui/circular-gauge/circular-gauge';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { GlassCard } from '../../shared/ui/glass-card/glass-card';
import { StatTile } from '../../shared/ui/stat-tile/stat-tile';

import { BudgetForm } from './components/budget-form/budget-form';

/**
 * Página interna "Presupuesto" (/budget): ya no está enlazada en la
 * navegación principal — la gestión del presupuesto se hizo accesible
 * directamente desde el Dashboard (icono junto a la cifra "Presupuesto"),
 * que es el flujo principal para el usuario. Esta ruta se mantiene
 * alcanzable (sin romper nada existente) y reutiliza el mismo BudgetForm.
 *
 * GET /api/budgets/summary?month=&year= no devuelve el `id` del presupuesto
 * (solo cifras agregadas), así que para poder editarlo hace falta cruzarlo
 * con GET /api/budgets (todos) y localizar el que coincide con el periodo.
 * Por eso se mantienen dos fuentes: `budgets` (para saber si existe y su id)
 * y `summary` (para las cifras calculadas por el backend).
 */
@Component({
  selector: 'aura-budgets',
  imports: [GlassCard, EmptyState, StatTile, CircularGauge, BudgetForm],
  templateUrl: './budgets.html',
  styleUrl: './budgets.css',
})
export class Budgets {
  private readonly budgetService = inject(BudgetService);
  private readonly summaryService = inject(SummaryService);
  protected readonly period = inject(PeriodStore);

  private readonly locale = inject(LOCALE_ID);
  private readonly currencyPipe = new CurrencyPipe(this.locale);

  // --- Datos ---
  protected readonly budgets = signal<Budget[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<ApiError | null>(null);

  protected readonly summary = signal<MonthlySummary | null>(null);
  protected readonly summaryLoading = signal(false);

  /** El presupuesto (con su id) del periodo actualmente seleccionado, si existe. */
  protected readonly currentBudget = computed<Budget | null>(
    () =>
      this.budgets().find((b) => b.month === this.period.month() && b.year === this.period.year()) ??
      null,
  );

  // --- Formulario (BudgetForm, compartido con el icono de editar del Dashboard) ---
  protected readonly isFormOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal<ApiError | null>(null);

  constructor() {
    this.loadBudgets();

    // Cada vez que cambia el presupuesto conocido para el periodo (porque
    // cambió el periodo o porque se acaba de crear/editar), se recarga el
    // resumen calculado por el backend. Si no hay presupuesto, no tiene
    // sentido llamar a /summary (respondería 404): se limpia directamente.
    effect(() => {
      const budget = this.currentBudget();
      if (budget) {
        this.loadSummary(budget.month, budget.year);
      } else {
        this.summary.set(null);
      }
    });
  }

  protected loadBudgets(): void {
    this.loading.set(true);
    this.error.set(null);
    this.budgetService.getAll().subscribe({
      next: (budgets) => {
        this.budgets.set(budgets);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err);
        this.loading.set(false);
      },
    });
  }

  private loadSummary(month: number, year: number): void {
    this.summaryLoading.set(true);
    this.summaryService.getMonthlySummary(month, year).subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.summaryLoading.set(false);
      },
      error: () => {
        // Si el presupuesto se acaba de borrar en otra pestaña, etc. No es
        // el flujo principal: simplemente no mostramos resumen.
        this.summary.set(null);
        this.summaryLoading.set(false);
      },
    });
  }

  protected formatCurrency(value: number): string {
    return this.currencyPipe.transform(value, 'EUR') ?? `${value.toFixed(2)} €`;
  }

  protected openForm(): void {
    this.formError.set(null);
    this.isFormOpen.set(true);
  }

  protected closeForm(): void {
    this.isFormOpen.set(false);
    this.formError.set(null);
  }

  protected onSaveBudget(amount: number): void {
    const request: BudgetRequest = { month: this.period.month(), year: this.period.year(), amount };
    const existing = this.currentBudget();

    this.saving.set(true);
    this.formError.set(null);
    const operation = existing
      ? this.budgetService.update(existing.id, request)
      : this.budgetService.create(request);

    operation.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadBudgets();
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.formError.set(err);
      },
    });
  }
}
