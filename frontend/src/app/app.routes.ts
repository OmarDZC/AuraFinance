import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
    title: 'Aura Finance · Dashboard',
  },
  {
    path: 'expenses',
    loadComponent: () => import('./features/expenses/expenses').then((m) => m.Expenses),
    title: 'Aura Finance · Expenses',
  },
  {
    path: 'budget',
    loadComponent: () => import('./features/budgets/budgets').then((m) => m.Budgets),
    title: 'Aura Finance · Monthly Budget',
  },
  {
    path: 'statistics',
    loadComponent: () => import('./features/statistics/statistics').then((m) => m.Statistics),
    title: 'Aura Finance · Statistics',
  },
  {
    path: 'goals',
    loadComponent: () => import('./features/goals/goals').then((m) => m.Goals),
    title: 'Aura Finance · Goals',
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings').then((m) => m.Settings),
    title: 'Aura Finance · Settings',
  },
  { path: '**', redirectTo: 'dashboard' },
];
