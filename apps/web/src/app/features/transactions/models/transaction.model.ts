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

export interface CategoryMeta {
  name: string;
  emoji: string;
  bg: string;
}

export interface AiSuggestion {
  categoryName: string | null;
  confidence: number;
}

export interface ImportJobResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  total: number;
  processed: number;
  imported: number;
  failed: number;
  errors: string[];
}

export interface AiInsight {
  type: 'overspending' | 'trend' | 'anomaly' | 'saving_opportunity';
  title: string;
  description: string;
  amount: number | null;
}

// Hardcoded สำหรับ Phase 2 — Phase 3 จะ fetch จาก /categories API แทน
export const DEFAULT_CATEGORIES: CategoryMeta[] = [
  { name: 'Food & Dining', emoji: '🍜', bg: 'rgba(167,139,250,0.12)' },
  { name: 'Transport',     emoji: '🚗', bg: 'rgba(45,212,191,0.12)' },
  { name: 'Housing',       emoji: '🏠', bg: 'rgba(244,114,182,0.12)' },
  { name: 'Utilities',     emoji: '⚡', bg: 'rgba(148,163,184,0.12)' },
  { name: 'Entertainment', emoji: '🎬', bg: 'rgba(251,146,60,0.12)' },
  { name: 'Groceries',     emoji: '🛒', bg: 'rgba(250,204,21,0.12)' },
  { name: 'Healthcare',    emoji: '🏥', bg: 'rgba(248,113,113,0.12)' },
  { name: 'Education',     emoji: '📚', bg: 'rgba(96,165,250,0.12)' },
  { name: 'Shopping',      emoji: '🛍',  bg: 'rgba(192,132,252,0.12)' },
  { name: 'Side Income',   emoji: '💼', bg: 'rgba(45,212,191,0.12)' },
  { name: 'Salary',        emoji: '💰', bg: 'rgba(45,212,191,0.15)' },
  { name: 'Investment',    emoji: '📈', bg: 'rgba(96,165,250,0.12)' },
  { name: 'Others',        emoji: '📌', bg: 'rgba(148,163,184,0.12)' },
];
