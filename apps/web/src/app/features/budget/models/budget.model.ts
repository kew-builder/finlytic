export interface BudgetResponse {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
  period: 'Monthly' | 'Yearly';
  startDate: string;
  endDate: string | null;
}

export interface CreateBudgetRequest {
  categoryId: string;
  amount: number;
  period: string;
  startDate: string;
  endDate?: string | null;
}

export interface UpdateBudgetRequest {
  amount: number;
  period: string;
  startDate: string;
  endDate?: string | null;
}
