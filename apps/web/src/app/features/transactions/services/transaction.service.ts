import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateTransactionRequest,
  TransactionFilters,
  TransactionResponse,
  UpdateTransactionRequest,
} from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/transactions`;

  getAll(filters: TransactionFilters = {}): Observable<TransactionResponse[]> {
    let params = new HttpParams();
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.type) params = params.set('type', filters.type);
    return this.http.get<TransactionResponse[]>(this.base, { params });
  }

  create(req: CreateTransactionRequest): Observable<TransactionResponse> {
    return this.http.post<TransactionResponse>(this.base, req);
  }

  update(id: string, req: UpdateTransactionRequest): Observable<TransactionResponse> {
    return this.http.put<TransactionResponse>(`${this.base}/${id}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
