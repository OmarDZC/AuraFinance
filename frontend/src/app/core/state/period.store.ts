import { Injectable, computed, signal } from '@angular/core';

export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/**
 * Estado del "mes/año seleccionado", compartido por Topbar, Dashboard,
 * Monthly Budget y Expenses. Es la única fuente de verdad del periodo
 * actualmente visualizado: cualquier pantalla puede leerlo (para filtrar
 * sus datos) o cambiarlo (Topbar y los propios selectores de página
 * escriben aquí en vez de mantener una copia local).
 *
 * Deliberadamente NO es un store genérico ni usa NgRx: es un servicio
 * `providedIn: 'root'` con unos pocos signals, coherente con "estado local
 * simple" pedido para esta fase.
 */
@Injectable({ providedIn: 'root' })
export class PeriodStore {
  private readonly today = new Date();

  readonly month = signal(this.today.getMonth() + 1); // 1-12
  readonly year = signal(this.today.getFullYear());

  readonly monthName = computed(() => MONTH_NAMES[this.month() - 1]);
  readonly label = computed(() => `${this.monthName()} ${this.year()}`);

  /** true si el periodo seleccionado es el mes real actual (según el reloj del sistema). */
  readonly isCurrentPeriod = computed(
    () => this.month() === this.today.getMonth() + 1 && this.year() === this.today.getFullYear(),
  );

  readonly daysInMonth = computed(() => new Date(this.year(), this.month(), 0).getDate());

  setPeriod(month: number, year: number): void {
    this.month.set(month);
    this.year.set(year);
  }

  previousMonth(): void {
    if (this.month() === 1) {
      this.month.set(12);
      this.year.update((y) => y - 1);
    } else {
      this.month.update((m) => m - 1);
    }
  }

  nextMonth(): void {
    if (this.month() === 12) {
      this.month.set(1);
      this.year.update((y) => y + 1);
    } else {
      this.month.update((m) => m + 1);
    }
  }
}

/** Mes/año anterior al dado, respetando el cambio de año en enero. */
export function previousPeriodOf(month: number, year: number): { month: number; year: number } {
  return month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
}
