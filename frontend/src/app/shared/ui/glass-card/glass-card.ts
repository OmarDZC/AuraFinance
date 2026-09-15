import { Component } from '@angular/core';

/**
 * Contenedor "glass panel" reutilizable: la superficie base de casi todas
 * las tarjetas del diseño de Stitch (fondo semitransparente + blur + radio
 * xl). El contenido se proyecta con <ng-content>, sin imponer un layout
 * interno concreto.
 */
@Component({
  selector: 'aura-glass-card',
  imports: [],
  templateUrl: './glass-card.html',
  styleUrl: './glass-card.css',
})
export class GlassCard {}
