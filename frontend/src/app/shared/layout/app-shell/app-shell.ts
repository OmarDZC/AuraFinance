import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';

/**
 * Shell visual de la aplicación: sidebar + topbar fijos y el área de
 * contenido enrutado. Es el único lugar que conoce el estado de apertura
 * del drawer de navegación en mobile/tablet.
 */
@Component({
  selector: 'aura-app-shell',
  imports: [RouterOutlet, Sidebar, Topbar],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
})
export class AppShell {
  protected readonly isMobileNavOpen = signal(false);

  protected toggleMobileNav(): void {
    this.isMobileNavOpen.update((open) => !open);
  }

  protected closeMobileNav(): void {
    this.isMobileNavOpen.set(false);
  }
}
