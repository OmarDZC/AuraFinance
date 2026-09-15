import { Component, computed, inject, output } from '@angular/core';

import { PeriodStore } from '../../../core/state/period.store';
import { BadgePill } from '../../ui/badge-pill/badge-pill';

/**
 * Barra superior: botón de menú (mobile), selector de mes y acciones.
 *
 * El selector de mes delega en PeriodStore (core/state), la única fuente de
 * verdad del periodo seleccionado: Dashboard, Monthly Budget y Expenses lo
 * comparten, así que cambiar el mes aquí los actualiza a todos.
 */
@Component({
  selector: 'aura-topbar',
  imports: [BadgePill],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  menuToggle = output<void>();

  protected readonly period = inject(PeriodStore);

  private readonly today = new Date();

  /** "Day X of Y" del mes real del sistema (solo tiene sentido para el mes actual). */
  protected readonly cycleLabel = computed(() => {
    const daysInMonth = new Date(this.today.getFullYear(), this.today.getMonth() + 1, 0).getDate();
    return `Cycle: Day ${this.today.getDate()} of ${daysInMonth}`;
  });

  protected previousMonth(): void {
    this.period.previousMonth();
  }

  protected nextMonth(): void {
    this.period.nextMonth();
  }
}
