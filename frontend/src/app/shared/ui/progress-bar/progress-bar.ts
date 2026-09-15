import { Component, computed, input } from '@angular/core';

export type ProgressBarTone = 'primary' | 'warning' | 'danger';

const FILL_CLASSES: Record<ProgressBarTone, string> = {
  primary: 'bg-primary-container',
  warning: 'bg-secondary',
  danger: 'bg-tertiary-fixed-dim',
};

/**
 * Barra de progreso lineal reutilizable (presupuesto consumido, gasto por
 * categoría, etc.). `value` en 0-100; se satura visualmente en 100 aunque
 * el dato real supere el 100% (sobregasto), para no romper el layout.
 */
@Component({
  selector: 'aura-progress-bar',
  imports: [],
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.css',
})
export class ProgressBar {
  /** 0-100 (puede recibirse >100 para indicar sobregasto; se satura al pintar). */
  value = input.required<number>();
  tone = input<ProgressBarTone>('primary');

  protected readonly widthPercent = computed(() => Math.min(100, Math.max(0, this.value())));
  protected readonly fillClass = computed(() => FILL_CLASSES[this.tone()]);
}
