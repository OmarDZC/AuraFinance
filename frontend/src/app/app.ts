import { Component } from '@angular/core';

import { AppShell } from './shared/layout/app-shell/app-shell';

@Component({
  selector: 'aura-root',
  imports: [AppShell],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
