import { Component, computed, input } from '@angular/core';

export interface LinePoint {
  x: number;
  /** Ya formateada por quien consume el componente (p. ej. "Día 14: 82,50 €"), para no acoplar el chart a moneda/locale. */
  label?: string;
  y: number;
}

interface ScaledPoint {
  cx: number;
  cy: number;
  highlighted: boolean;
  raw: LinePoint;
}

/**
 * Línea de evolución (p. ej. gasto diario/acumulado) con SVG puro, sin
 * librería de gráficos: un único <path> a partir de puntos escalados a un
 * viewBox fijo (mismo enfoque sin dependencias que CircularGauge/DonutChart).
 */
@Component({
  selector: 'aura-line-chart',
  imports: [],
  templateUrl: './line-chart.html',
  styleUrl: './line-chart.css',
})
export class LineChart {
  points = input.required<LinePoint[]>();
  /** `x` del punto a resaltar (p. ej. el día de hoy, si el periodo mostrado es el actual). */
  highlightX = input<number | null>(null);
  /** Debe ser único si se usan varias instancias en la misma página (evita colisión de <linearGradient> ids). */
  gradientId = input('aura-line-chart-gradient');

  private readonly viewWidth = 300;
  private readonly viewHeight = 100;
  private readonly topPadding = 10;

  protected readonly viewBox = `0 0 ${this.viewWidth} ${this.viewHeight}`;

  private readonly maxY = computed(() => Math.max(1, ...this.points().map((p) => p.y)));

  protected readonly scaledPoints = computed<ScaledPoint[]>(() => {
    const pts = this.points();
    const step = pts.length > 1 ? this.viewWidth / (pts.length - 1) : 0;
    const usableHeight = this.viewHeight - this.topPadding;
    return pts.map((p, index) => ({
      cx: pts.length > 1 ? index * step : this.viewWidth / 2,
      cy: this.viewHeight - (p.y / this.maxY()) * usableHeight,
      highlighted: p.x === this.highlightX(),
      raw: p,
    }));
  });

  protected readonly linePath = computed(() => {
    const pts = this.scaledPoints();
    if (pts.length === 0) {
      return '';
    }
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.cx.toFixed(2)},${p.cy.toFixed(2)}`).join(' ');
  });

  protected readonly areaPath = computed(() => {
    const pts = this.scaledPoints();
    if (pts.length === 0) {
      return '';
    }
    const body = pts.map((p) => `${p.cx.toFixed(2)},${p.cy.toFixed(2)}`).join(' L ');
    const first = pts[0];
    const last = pts[pts.length - 1];
    return `M ${first.cx.toFixed(2)},${this.viewHeight} L ${body} L ${last.cx.toFixed(2)},${this.viewHeight} Z`;
  });
}
