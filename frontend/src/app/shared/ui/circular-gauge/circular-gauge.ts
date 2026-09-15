import { Component, computed, input } from '@angular/core';

/**
 * Anillo circular SVG (% consumido de un presupuesto). Sin librería de
 * gráficos: un único <circle> con stroke-dasharray calculado a partir del
 * perímetro. El valor puede superar 100 (sobregasto); el anillo se satura
 * visualmente en 100% para no desbordar el trazo.
 */
@Component({
  selector: 'aura-circular-gauge',
  imports: [],
  templateUrl: './circular-gauge.html',
  styleUrl: './circular-gauge.css',
})
export class CircularGauge {
  /** 0-100+ (puede superar 100 en caso de sobregasto). */
  percentage = input.required<number>();
  caption = input('Consumed');

  private readonly radius = 42;
  protected readonly circumference = 2 * Math.PI * this.radius;

  protected readonly clampedPercentage = computed(() => Math.min(100, Math.max(0, this.percentage())));
  protected readonly dashOffset = computed(
    () => this.circumference * (1 - this.clampedPercentage() / 100),
  );
  protected readonly displayValue = computed(() => Math.round(this.percentage()));
}
