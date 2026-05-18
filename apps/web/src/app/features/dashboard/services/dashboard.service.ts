import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  BudgetVsActual,
  CategorySummary,
  DashboardSummary,
  Forecast,
  SpendingTrend,
} from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/dashboard`;

  getSummary(startDate?: string, endDate?: string): Observable<DashboardSummary> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<DashboardSummary>(`${this.base}/summary`, { params });
  }

  getCategorySummary(startDate?: string, endDate?: string): Observable<CategorySummary[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<CategorySummary[]>(`${this.base}/categories`, { params });
  }

  getTrend(): Observable<SpendingTrend[]> {
    return this.http.get<SpendingTrend[]>(`${this.base}/trend`);
  }

  getBudgetVsActual(year: number, month: number): Observable<BudgetVsActual[]> {
    const params = new HttpParams().set('year', year).set('month', month);
    return this.http.get<BudgetVsActual[]>(`${this.base}/budget-vs-actual`, { params });
  }

  getForecast(): Observable<Forecast[]> {
    return this.http.get<Forecast[]>(`${this.base}/forecast`);
  }
}
