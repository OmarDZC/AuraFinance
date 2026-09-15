import { Component, input } from '@angular/core';

import { GlassCard } from '../glass-card/glass-card';

/**
 * Placeholder visual coherente con el design system de Aura para secciones
 * que todavía no tienen implementación (Fase 0). No debe usarse para simular
 * datos: solo comunica que la funcionalidad llegará en una fase posterior.
 */
@Component({
  selector: 'aura-empty-state',
  imports: [GlassCard],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css',
})
export class EmptyState {
  /** Nombre de un icono de Material Symbols Outlined. */
  icon = input('hourglass_empty');
  title = input.required<string>();
  message = input('Esta sección se implementará en una fase posterior.');
}
