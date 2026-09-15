import { Component, computed, input } from '@angular/core';

export type StatTileTone = 'default' | 'primary' | 'secondary' | 'warning';

const VALUE_CLASSES: Record<StatTileTone, string> = {
  default: 'text-on-surface',
  primary: 'text-primary',
  secondary: 'text-secondary',
  warning: 'text-tertiary-fixed-dim',
};

/**
 * Par etiqueta+valor reutilizable (Starting Ceiling, Total Debits...). El
 * valor ya viene formateado por quien lo usa (p. ej. con CurrencyPipe), este
 * componente solo se ocupa de la tipografía/color.
 */
@Component({
  selector: 'aura-stat-tile',
  imports: [],
  templateUrl: './stat-tile.html',
  styleUrl: './stat-tile.css',
})
export class StatTile {
  label = input.required<string>();
  value = input.required<string>();
  tone = input<StatTileTone>('default');

  protected readonly valueClass = computed(() => VALUE_CLASSES[this.tone()]);
}
