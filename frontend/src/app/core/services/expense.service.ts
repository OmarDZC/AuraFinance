import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { Expense, ExpenseFilters, ExpenseRequest } from '../models/expense.model';

/**
 * Encapsula únicamente las llamadas HTTP a /api/expenses
 * (ExpenseController en el backend). Sin lógica de negocio.
 */
@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/api/expenses`;

  /** GET /api/expenses?month=&year=&categoryId= (todos los filtros son opcionales) */
  getAll(filters: ExpenseFilters = {}): Observable<Expense[]> {
    let params = new HttpParams();
    if (filters.month != null) {
      params = params.set('month', filters.month);
    }
    if (filters.year != null) {
      params = params.set('year', filters.year);
    }
    if (filters.categoryId != null) {
      params = params.set('categoryId', filters.categoryId);
    }
    return this.http.get<Expense[]>(this.baseUrl, { params });
  }

  /** GET /api/expenses/{id} */
  getById(id: number): Observable<Expense> {
    return this.http.get<Expense>(`${this.baseUrl}/${id}`);
  }

  /** POST /api/expenses */
  create(request: ExpenseRequest): Observable<Expense> {
    return this.http.post<Expense>(this.baseUrl, request);
  }

  /** PUT /api/expenses/{id} */
  update(id: number, request: ExpenseRequest): Observable<Expense> {
    return this.http.put<Expense>(`${this.baseUrl}/${id}`, request);
  }

  /** DELETE /api/expenses/{id} */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
