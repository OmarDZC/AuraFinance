import { Component, effect, inject, signal } from '@angular/core';

import { ApiError } from '../../core/models/api-error.model';
import { Category } from '../../core/models/category.model';
import { Expense, ExpenseRequest } from '../../core/models/expense.model';
import { CategoryService } from '../../core/services/category.service';
import { ExpenseService } from '../../core/services/expense.service';
import { MONTH_NAMES, PeriodStore } from '../../core/state/period.store';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { GlassCard } from '../../shared/ui/glass-card/glass-card';

import { ExpenseForm } from './components/expense-form/expense-form';
import { ExpenseList } from './components/expense-list/expense-list';

/**
 * Página de gastos: lista, filtra, crea, edita y elimina gastos reales
 * contra el backend. Es el único componente de esta feature que conoce los
 * services (ExpenseService/CategoryService); ExpenseForm y ExpenseList son
 * presentacionales.
 *
 * El filtro de mes/año NO mantiene su propia copia: lee y escribe
 * directamente en PeriodStore (compartido con Topbar/Dashboard/Budget), así
 * que cambiar el mes desde cualquiera de esas pantallas se refleja aquí.
 * "All periods" es la única excepción de estado puramente local, porque no
 * tiene sentido como concepto compartido (Dashboard/Budget siempre
 * necesitan un mes concreto).
 */
@Component({
  selector: 'aura-expenses',
  imports: [GlassCard, EmptyState, ExpenseForm, ExpenseList],
  templateUrl: './expenses.html',
  styleUrl: './expenses.css',
})
export class Expenses {
  private readonly expenseService = inject(ExpenseService);
  private readonly categoryService = inject(CategoryService);
  protected readonly period = inject(PeriodStore);

  protected readonly months = MONTH_NAMES.map((name, index) => ({ value: index + 1, name }));

  // --- Filtros ---
  protected readonly showAllPeriods = signal(false);
  protected readonly selectedCategoryId = signal<number | null>(null);

  // --- Datos ---
  protected readonly categories = signal<Category[]>([]);
  protected readonly expenses = signal<Expense[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<ApiError | null>(null);

  // --- Formulario crear/editar ---
  protected readonly isFormOpen = signal(false);
  protected readonly editingExpense = signal<Expense | null>(null);
  protected readonly formError = signal<ApiError | null>(null);

  constructor() {
    this.loadCategories();

    // Recarga automáticamente al cambiar mes/año (desde esta página, el
    // Topbar o Budget), "All periods" o la categoría filtrada.
    effect(() => {
      this.period.month();
      this.period.year();
      this.showAllPeriods();
      this.selectedCategoryId();
      this.loadExpenses();
    });
  }

  private loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (err: ApiError) => this.error.set(err),
    });
  }

  protected loadExpenses(): void {
    this.loading.set(true);
    this.error.set(null);

    const allPeriods = this.showAllPeriods();
    this.expenseService
      .getAll({
        month: allPeriods ? undefined : this.period.month(),
        year: allPeriods ? undefined : this.period.year(),
        categoryId: this.selectedCategoryId() ?? undefined,
      })
      .subscribe({
        next: (expenses) => {
          this.expenses.set(expenses);
          this.loading.set(false);
        },
        error: (err: ApiError) => {
          this.error.set(err);
          this.loading.set(false);
        },
      });
  }

  protected onMonthChange(value: string): void {
    if (value === '') {
      this.showAllPeriods.set(true);
    } else {
      this.showAllPeriods.set(false);
      this.period.setPeriod(Number(value), this.period.year());
    }
  }

  protected onYearChange(value: string): void {
    const year = Number(value);
    if (Number.isInteger(year) && year > 0) {
      this.period.setPeriod(this.period.month(), year);
    }
  }

  protected onCategoryFilterChange(value: string): void {
    this.selectedCategoryId.set(value === '' ? null : Number(value));
  }

  protected openCreateForm(): void {
    this.editingExpense.set(null);
    this.formError.set(null);
    this.isFormOpen.set(true);
  }

  protected openEditForm(expense: Expense): void {
    this.editingExpense.set(expense);
    this.formError.set(null);
    this.isFormOpen.set(true);
  }

  protected closeForm(): void {
    this.isFormOpen.set(false);
    this.editingExpense.set(null);
    this.formError.set(null);
  }

  protected onSave(request: ExpenseRequest): void {
    const editing = this.editingExpense();
    const operation = editing
      ? this.expenseService.update(editing.id, request)
      : this.expenseService.create(request);

    operation.subscribe({
      next: () => {
        this.closeForm();
        this.loadExpenses();
      },
      error: (err: ApiError) => this.formError.set(err),
    });
  }

  protected onDelete(expense: Expense): void {
    const label = expense.description?.trim() || expense.category.name;
    const confirmed = confirm(`¿Eliminar el gasto "${label}" de ${expense.amount} €?`);
    if (!confirmed) {
      return;
    }

    this.expenseService.delete(expense.id).subscribe({
      next: () => this.loadExpenses(),
      error: (err: ApiError) => this.error.set(err),
    });
  }
}
