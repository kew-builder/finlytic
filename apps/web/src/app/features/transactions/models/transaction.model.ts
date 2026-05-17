export interface TransactionResponse {
  id: string;
  amount: number;
  type: 'Income' | 'Expense';
  description: string | null;
  transactionDate: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  aiCategorized: boolean;
  createdAt: string;
}

export interface CreateTransactionRequest {
  amount: number;
  type: 'Income' | 'Expense';
  description: string | null;
  transactionDate: string;
  categoryId: string | null;
}

export type UpdateTransactionRequest = CreateTransactionRequest;

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: 'Income' | 'Expense';
}
