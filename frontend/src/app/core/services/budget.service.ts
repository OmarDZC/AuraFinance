import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { Budget, BudgetRequest } from '../models/budget.model';

/**
 * Encapsula únicamente las llamadas HTTP a /api/budgets
 * (BudgetController en el backend, sin el endpoint de summary — ver
 * SummaryService). Sin lógica de negocio.
 */
@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/api/budgets`;

  /** GET /api/budgets */
  getAll(): Observable<Budget[]> {
    return this.http.get<Budget[]>(this.baseUrl);
  }

  /** GET /api/budgets/current */
  getCurrent(): Observable<Budget> {
    return this.http.get<Budget>(`${this.baseUrl}/current`);
  }

  /** POST /api/budgets */
  create(request: BudgetRequest): Observable<Budget> {
    return this.http.post<Budget>(this.baseUrl, request);
  }

  /** PUT /api/budgets/{id} */
  update(id: number, request: BudgetRequest): Observable<Budget> {
    return this.http.put<Budget>(`${this.baseUrl}/${id}`, request);
  }
}
