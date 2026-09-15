import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';

import { BadgePill } from '../../../../shared/ui/badge-pill/badge-pill';
import { Expense } from '../../../../core/models/expense.model';

/**
 * Renderiza el listado de gastos. Puramente presentacional: no llama a
 * ExpenseService ni hace peticiones HTTP, solo emite eventos para que el
 * componente contenedor (Expenses) decida qué hacer.
 */
@Component({
  selector: 'aura-expense-list',
  imports: [DatePipe, CurrencyPipe, BadgePill],
  templateUrl: './expense-list.html',
  styleUrl: './expense-list.css',
})
export class ExpenseList {
  expenses = input.required<Expense[]>();

  edit = output<Expense>();
  delete = output<Expense>();
}
