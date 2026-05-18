import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BudgetResponse, CreateBudgetRequest, UpdateBudgetRequest } from '../models/budget.model';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/budgets`;

  getAll(): Observable<BudgetResponse[]> {
    return this.http.get<BudgetResponse[]>(this.base);
  }

  create(req: CreateBudgetRequest): Observable<BudgetResponse> {
    return this.http.post<BudgetResponse>(this.base, req);
  }

  update(id: string, req: UpdateBudgetRequest): Observable<BudgetResponse> {
    return this.http.put<BudgetResponse>(`${this.base}/${id}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
