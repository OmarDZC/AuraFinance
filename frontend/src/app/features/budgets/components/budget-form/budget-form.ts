import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { maxTwoDecimalsValidator } from '../../../../shared/validators/money.validator';

/**
 * Formulario reutilizable de creación/edición del presupuesto mensual (un
 * único campo: amount). Presentacional: no llama a BudgetService, emite el
 * importe ya validado para que quien lo use (Dashboard, y la página interna
 * /budget) decida si llama a create() o update(). Evita duplicar la lógica
 * de validación/errores en dos sitios.
 */
@Component({
  selector: 'aura-budget-form',
  imports: [ReactiveFormsModule],
  templateUrl: './budget-form.html',
  styleUrl: './budget-form.css',
})
export class BudgetForm {
  private readonly fb = inject(FormBuilder);

  /** Importe actual, si ya existe presupuesto para el periodo (modo edición). */
  currentAmount = input<number | null>(null);
  /** Etiqueta del periodo a mostrar en el título (p. ej. "Septiembre 2026"). */
  periodLabel = input.required<string>();
  serverError = input<string | null>(null);
  saving = input(false);

  save = output<number>();
  cancelled = output<void>();

  protected readonly form = this.fb.group({
    amount: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
      maxTwoDecimalsValidator(),
    ]),
  });

  constructor() {
    effect(() => {
      this.form.reset({ amount: this.currentAmount() });
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

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.getRawValue().amount as number);
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }
}
