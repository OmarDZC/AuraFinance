import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';

import { ApiError } from '../../../../core/models/api-error.model';
import { Category } from '../../../../core/models/category.model';
import { Expense, ExpenseRequest, MovementType } from '../../../../core/models/expense.model';
import { CategoryService } from '../../../../core/services/category.service';
import { maxTwoDecimalsValidator } from '../../../../shared/validators/money.validator';

import { CategoryManager } from '../category-manager/category-manager';

/** Espeja @PastOrPresent de ExpenseRequest.date (backend). */
function notFutureDateValidator(): ValidatorFn {
  return (control) => {
    if (!control.value) {
      return null;
    }
    const today = new Date().toISOString().slice(0, 10);
    return control.value > today ? { futureDate: true } : null;
  };
}

const REQUIRED_MESSAGES: Record<string, string> = {
  amount: 'El importe es obligatorio',
  date: 'La fecha es obligatoria',
  categoryId: 'La categoría es obligatoria',
};

/**
 * Formulario reutilizable de creación/edición de movimientos (gastos e
 * ingresos). Es el único punto de la app que crea/edita movimientos: lo usan
 * tanto la página Expenses como el botón flotante del Dashboard.
 *
 * Cambio respecto a la versión anterior: ya NO recibe `categories` por
 * @Input. Las categorías son un dato transversal a todo el flujo de
 * movimientos (no solo de Expenses), así que este componente carga las
 * suyas propias con CategoryService — evita que cada pantalla que abra este
 * formulario (Expenses, Dashboard) tenga que repetir esa carga y pasarla
 * hacia abajo. También aloja el modal "Gestionar categorías"
 * (CategoryManager): al cerrarse, recarga la lista para reflejar altas/bajas
 * sin salir del formulario.
 *
 * Las validaciones reproducen exactamente las de
 * com.aura.finance.dto.expense.ExpenseRequest en el backend.
 */
@Component({
  selector: 'aura-expense-form',
  imports: [ReactiveFormsModule, CategoryManager],
  templateUrl: './expense-form.html',
  styleUrl: './expense-form.css',
})
export class ExpenseForm {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);

  /** Si viene informado, el formulario se abre en modo edición. */
  expense = input<Expense | null>(null);
  /** Mensaje de error devuelto por el backend al intentar guardar (409/400/404). */
  serverError = input<string | null>(null);

  save = output<ExpenseRequest>();
  cancelled = output<void>();

  protected readonly isEditMode = computed(() => this.expense() !== null);
  protected readonly maxDate = new Date().toISOString().slice(0, 10);

  protected readonly categories = signal<Category[]>([]);
  protected readonly categoriesError = signal<ApiError | null>(null);
  protected readonly isCategoryManagerOpen = signal(false);

  protected readonly form = this.fb.group({
    type: this.fb.nonNullable.control<MovementType>('EXPENSE', [Validators.required]),
    amount: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
      maxTwoDecimalsValidator(),
    ]),
    categoryId: this.fb.control<number | null>(null, [Validators.required]),
    date: this.fb.nonNullable.control<string>('', [Validators.required, notFutureDateValidator()]),
    description: this.fb.nonNullable.control<string>('', [Validators.maxLength(255)]),
  });

  constructor() {
    this.loadCategories();

    effect(() => {
      const expense = this.expense();
      if (expense) {
        this.form.patchValue({
          type: expense.type,
          amount: expense.amount,
          date: expense.date,
          description: expense.description ?? '',
          categoryId: expense.category.id,
        });
      } else {
        this.form.reset({
          type: 'EXPENSE',
          amount: null,
          date: this.maxDate,
          description: '',
          categoryId: null,
        });
      }
    });
  }

  protected loadCategories(): void {
    this.categoriesError.set(null);
    this.categoryService.getAll().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (err: ApiError) => this.categoriesError.set(err),
    });
  }

  protected errorFor(controlName: keyof typeof REQUIRED_MESSAGES | 'description'): string | null {
    const control = this.form.get(controlName);
    if (!control || !control.touched || control.valid) {
      return null;
    }
    if (control.hasError('required')) {
      return REQUIRED_MESSAGES[controlName] ?? 'Campo obligatorio';
    }
    if (control.hasError('min')) {
      return 'El importe debe ser mayor que 0';
    }
    if (control.hasError('maxTwoDecimals')) {
      return 'El importe no puede tener más de 2 decimales';
    }
    if (control.hasError('futureDate')) {
      return 'La fecha no puede ser futura';
    }
    if (control.hasError('maxlength')) {
      return 'La descripción no puede superar los 255 caracteres';
    }
    return null;
  }

  protected selectType(type: MovementType): void {
    this.form.controls.type.setValue(type);
  }

  protected openCategoryManager(): void {
    this.isCategoryManagerOpen.set(true);
  }

  protected onCategoryManagerClosed(): void {
    this.isCategoryManagerOpen.set(false);
    this.loadCategories();
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request: ExpenseRequest = {
      type: value.type,
      amount: value.amount as number,
      date: value.date,
      description: value.description?.trim() ? value.description.trim() : null,
      categoryId: value.categoryId as number,
    };
    this.save.emit(request);
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }
}
