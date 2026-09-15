import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';

import { Category } from '../../../../core/models/category.model';
import { Expense, ExpenseRequest } from '../../../../core/models/expense.model';
import { maxTwoDecimalsValidator } from '../../../../shared/validators/money.validator';

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
 * Formulario reutilizable de creación/edición de gastos.
 *
 * Presentacional: no llama a ExpenseService. Recibe las categorías reales y,
 * opcionalmente, el gasto a editar; emite el payload ya listo como
 * ExpenseRequest para que el componente contenedor (Expenses) decida si
 * llama a create() o update().
 *
 * Las validaciones reproducen exactamente las de
 * com.aura.finance.dto.expense.ExpenseRequest en el backend.
 */
@Component({
  selector: 'aura-expense-form',
  imports: [ReactiveFormsModule],
  templateUrl: './expense-form.html',
  styleUrl: './expense-form.css',
})
export class ExpenseForm {
  private readonly fb = inject(FormBuilder);

  categories = input.required<Category[]>();
  /** Si viene informado, el formulario se abre en modo edición. */
  expense = input<Expense | null>(null);
  /** Mensaje de error devuelto por el backend al intentar guardar (409/400/404). */
  serverError = input<string | null>(null);

  save = output<ExpenseRequest>();
  cancelled = output<void>();

  protected readonly isEditMode = computed(() => this.expense() !== null);
  protected readonly maxDate = new Date().toISOString().slice(0, 10);

  protected readonly form = this.fb.group({
    amount: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
      maxTwoDecimalsValidator(),
    ]),
    date: this.fb.nonNullable.control<string>('', [Validators.required, notFutureDateValidator()]),
    description: this.fb.nonNullable.control<string>('', [Validators.maxLength(255)]),
    categoryId: this.fb.control<number | null>(null, [Validators.required]),
  });

  constructor() {
    effect(() => {
      const expense = this.expense();
      if (expense) {
        this.form.patchValue({
          amount: expense.amount,
          date: expense.date,
          description: expense.description ?? '',
          categoryId: expense.category.id,
        });
      } else {
        this.form.reset({
          amount: null,
          date: this.maxDate,
          description: '',
          categoryId: null,
        });
      }
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

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request: ExpenseRequest = {
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
