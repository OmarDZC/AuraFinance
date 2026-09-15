import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

// "/budget" ya no se enlaza en la navegación principal: el presupuesto se
// consulta y edita directamente desde el Dashboard (icono junto a la cifra
// "Presupuesto"). La ruta sigue existiendo y es alcanzable por URL, solo se
// retira del menú porque ya no aporta una pantalla independiente necesaria.
const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Resumen', icon: 'dashboard' },
  { path: '/expenses', label: 'Gastos', icon: 'receipt_long' },
  { path: '/statistics', label: 'Estadísticas', icon: 'analytics' },
  { path: '/goals', label: 'Objetivos', icon: 'flag' },
];

/**
 * Navegación lateral de la aplicación. En escritorio se muestra fija y
 * siempre visible; en mobile/tablet actúa como drawer controlado por
 * `isOpen` (ver AppShell), que decide cuándo montarla sobre el contenido.
 */
@Component({
  selector: 'aura-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  /** Solo relevante en mobile/tablet: si el drawer está abierto. */
  isOpen = input(false);
  /** Se emite al pulsar un enlace o el overlay, para que el shell cierre el drawer. */
  closeRequested = output<void>();

  protected readonly navItems = NAV_ITEMS;

  protected onNavigate(): void {
    this.closeRequested.emit();
  }
}
