import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/expenses', label: 'Expenses', icon: 'receipt_long' },
  { path: '/statistics', label: 'Statistics', icon: 'analytics' },
  { path: '/budget', label: 'Monthly Budget', icon: 'account_balance_wallet' },
  { path: '/goals', label: 'Goals', icon: 'flag' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
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
