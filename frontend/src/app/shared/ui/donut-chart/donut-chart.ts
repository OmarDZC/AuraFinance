import { Component, computed, input } from '@angular/core';

export interface DonutSlice {
  name: string;
  percentage: number;
}

/**
 * Paleta cíclica de colores del tema Aura (verdes/teal existentes en
 * @theme) para diferenciar categorías. Los arrays deben escribirse como
 * clases literales completas (no concatenadas en runtime) para que Tailwind
 * las detecte al escanear el código fuente.
 */
export const DONUT_STROKE_CLASSES: string[] = [
  'text-primary-container',
  'text-secondary',
  'text-primary-fixed',
  'text-secondary-container',
  'text-primary-fixed-dim',
  'text-outline',
  'text-tertiary-fixed-dim',
];

export const DONUT_DOT_CLASSES: string[] = [
  'bg-primary-container',
  'bg-secondary',
  'bg-primary-fixed',
  'bg-secondary-container',
  'bg-primary-fixed-dim',
  'bg-outline',
  'bg-tertiary-fixed-dim',
];

interface DonutSegment {
  strokeClass: string;
  dasharray: string;
  dashoffset: number;
}

/**
 * Donut de distribución (p. ej. gasto por categoría) con SVG puro: un
 * <circle> por segmento con stroke-dasharray/offset calculados a partir del
 * perímetro, sin librería de gráficos (mismo enfoque que CircularGauge).
 */
@Component({
  selector: 'aura-donut-chart',
  imports: [],
  templateUrl: './donut-chart.html',
  styleUrl: './donut-chart.css',
})
export class DonutChart {
  /** Ya ordenadas de mayor a menor; `percentage` en 0-100 sobre el total. */
  slices = input.required<DonutSlice[]>();
  centerLabel = input('');
  centerValue = input('');

  private readonly radius = 42;
  protected readonly circumference = 2 * Math.PI * this.radius;

  protected readonly segments = computed<DonutSegment[]>(() => {
    let cumulativePercentage = 0;
    return this.slices().map((slice, index) => {
      const clamped = Math.max(0, Math.min(100, slice.percentage));
      const dashLength = (clamped / 100) * this.circumference;
      const segment: DonutSegment = {
        strokeClass: DONUT_STROKE_CLASSES[index % DONUT_STROKE_CLASSES.length],
        dasharray: `${dashLength} ${this.circumference - dashLength}`,
        dashoffset: -((cumulativePercentage / 100) * this.circumference),
      };
      cumulativePercentage += clamped;
      return segment;
    });
  });
}
