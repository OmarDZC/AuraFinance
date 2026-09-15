import { Component, computed, input } from '@angular/core';

export type BadgePillTone = 'muted' | 'primary' | 'secondary';

const TONE_CLASSES: Record<BadgePillTone, string> = {
  muted: 'bg-surface-container-high/80 text-on-surface-variant',
  primary: 'bg-primary-container/10 text-primary',
  secondary: 'bg-surface-container-low/60 text-secondary',
};

const DOT_CLASSES: Record<BadgePillTone, string> = {
  muted: 'bg-outline',
  primary: 'bg-primary-container',
  secondary: 'bg-secondary',
};

/**
 * Píldora de estado/etiqueta reutilizable (p. ej. "Cycle: Day 18 of 30" en el
 * topbar, "Pro Plan" en el perfil del sidebar). El texto se proyecta con
 * <ng-content>; `dot` añade el punto de color característico del diseño.
 */
@Component({
  selector: 'aura-badge-pill',
  imports: [],
  templateUrl: './badge-pill.html',
  styleUrl: './badge-pill.css',
})
export class BadgePill {
  tone = input<BadgePillTone>('muted');
  dot = input(false);

  protected readonly toneClasses = computed(() => TONE_CLASSES[this.tone()]);
  protected readonly dotClasses = computed(() => DOT_CLASSES[this.tone()]);
}
