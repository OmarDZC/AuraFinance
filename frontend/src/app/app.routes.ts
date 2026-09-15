import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
    title: 'Aura Finance · Resumen',
  },
  {
    path: 'expenses',
    loadComponent: () => import('./features/expenses/expenses').then((m) => m.Expenses),
    title: 'Aura Finance · Gastos',
  },
  {
    path: 'budget',
    loadComponent: () => import('./features/budgets/budgets').then((m) => m.Budgets),
    title: 'Aura Finance · Presupuesto',
  },
  {
    path: 'statistics',
    loadComponent: () => import('./features/statistics/statistics').then((m) => m.Statistics),
    title: 'Aura Finance · Estadísticas',
  },
  {
    path: 'goals',
    loadComponent: () => import('./features/goals/goals').then((m) => m.Goals),
    title: 'Aura Finance · Objetivos',
  },
  { path: '**', redirectTo: 'dashboard' },
];
