import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ApiError } from '../../core/models/api-error.model';
import { Budget, BudgetRequest } from '../../core/models/budget.model';
import { MonthlySummary } from '../../core/models/monthly-summary.model';
import { BudgetService } from '../../core/services/budget.service';
import { SummaryService } from '../../core/services/summary.service';
import { PeriodStore } from '../../core/state/period.store';
import { maxTwoDecimalsValidator } from '../../shared/validators/money.validator';
import { CircularGauge } from '../../shared/ui/circular-gauge/circular-gauge';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { GlassCard } from '../../shared/ui/glass-card/glass-card';
import { StatTile } from '../../shared/ui/stat-tile/stat-tile';

/**
 * Página "Monthly Budget": consulta, crea y edita el presupuesto del mes
 * seleccionado (PeriodStore, compartido con Topbar/Dashboard/Expenses).
 *
 * GET /api/budgets/summary?month=&year= no devuelve el `id` del presupuesto
 * (solo cifras agregadas), así que para poder editarlo hace falta cruzarlo
 * con GET /api/budgets (todos) y localizar el que coincide con el periodo.
 * Por eso se mantienen dos fuentes: `budgets` (para saber si existe y su id)
 * y `summary` (para las cifras calculadas por el backend).
 *
 * El formulario de alta/edición es un único campo (amount): se mantiene
 * inline en esta página, sin componente aparte, por el mismo criterio que
 * en Categories/Settings.
 */
@Component({
  selector: 'aura-budgets',
  imports: [GlassCard, EmptyState, StatTile, CircularGauge, ReactiveFormsModule],
  templateUrl: './budgets.html',
  styleUrl: './budgets.css',
})
export class Budgets {
  private readonly budgetService = inject(BudgetService);
  private readonly summaryService = inject(SummaryService);
  private readonly fb = inject(FormBuilder);
  protected readonly period = inject(PeriodStore);

  private readonly currencyPipe = new CurrencyPipe('en-US');

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

  // --- Formulario (un único campo: amount) ---
  protected readonly isFormOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal<ApiError | null>(null);

  protected readonly form = this.fb.group({
    amount: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
      maxTwoDecimalsValidator(),
    ]),
  });

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
    return this.currencyPipe.transform(value, 'EUR') ?? `€${value.toFixed(2)}`;
  }

  protected openForm(): void {
    this.formError.set(null);
    this.form.reset({ amount: this.currentBudget()?.amount ?? null });
    this.isFormOpen.set(true);
  }

  protected closeForm(): void {
    this.isFormOpen.set(false);
    this.formError.set(null);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const amount = this.form.getRawValue().amount as number;
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

  protected errorFor(controlName: 'amount'): string | null {
    const control = this.form.get(controlName);
    if (!control || !control.touched || control.valid) {
      return null;
    }
    if (control.hasError('required')) {
      return 'El importe es obligatorio';
    }
    if (control.hasError('min')) {
      return 'El importe debe ser mayor que 0';
    }
    if (control.hasError('maxTwoDecimals')) {
      return 'El importe no puede tener más de 2 decimales';
    }
    return null;
  }
}
