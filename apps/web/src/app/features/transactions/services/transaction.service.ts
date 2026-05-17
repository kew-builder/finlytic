import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AiInsight,
  AiSuggestion,
  CreateTransactionRequest,
  ImportJobResponse,
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

  suggestCategory(description: string, amount: number, type: 'Income' | 'Expense'): Observable<AiSuggestion> {
    return this.http.post<AiSuggestion>(`${this.base}/suggest`, { description, amount, type });
  }

  uploadCsv(file: File): Observable<{ jobId: string; rowCount: number; statusUrl: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ jobId: string; rowCount: number; statusUrl: string }>(
      `${environment.apiUrl}/import/csv`, form);
  }

  getImportJob(jobId: string): Observable<ImportJobResponse> {
    return this.http.get<ImportJobResponse>(`${environment.apiUrl}/import/jobs/${jobId}`);
  }

  getInsights(): Observable<AiInsight[]> {
    return this.http.get<AiInsight[]>(`${environment.apiUrl}/insights`);
  }
}
