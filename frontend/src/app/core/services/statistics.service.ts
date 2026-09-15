import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { StatisticsResponse } from '../models/statistics.model';

/**
 * Encapsula únicamente la llamada HTTP a GET /api/statistics
 * (StatisticsController en el backend). Sin lógica de negocio: todas las
 * cifras (incluida la agregación por categoría/día) ya vienen calculadas
 * por StatisticsService en el backend.
 */
@Injectable({ providedIn: 'root' })
export class StatisticsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/api/statistics`;

  /** GET /api/statistics?month=&year= (ambos opcionales: por defecto, mes actual) */
  getStatistics(month?: number, year?: number): Observable<StatisticsResponse> {
    let params = new HttpParams();
    if (month != null) {
      params = params.set('month', month);
    }
    if (year != null) {
      params = params.set('year', year);
    }
    return this.http.get<StatisticsResponse>(this.baseUrl, { params });
  }
}
