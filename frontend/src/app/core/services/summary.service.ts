import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { MonthlySummary } from '../models/monthly-summary.model';

/**
 * Encapsula únicamente la llamada HTTP a GET /api/budgets/summary
 * (expuesta desde BudgetController, pero conceptualmente distinta del CRUD
 * de presupuestos: por eso vive en su propio service, igual que en el
 * backend vive en su propio SummaryService). Sin lógica de negocio: el
 * cálculo (restante, % usado) ya lo hace el backend.
 */
@Injectable({ providedIn: 'root' })
export class SummaryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/api/budgets/summary`;

  /** GET /api/budgets/summary?month=&year= (ambos opcionales: por defecto, mes actual) */
  getMonthlySummary(month?: number, year?: number): Observable<MonthlySummary> {
    let params = new HttpParams();
    if (month != null) {
      params = params.set('month', month);
    }
    if (year != null) {
      params = params.set('year', year);
    }
    return this.http.get<MonthlySummary>(this.baseUrl, { params });
  }
}
