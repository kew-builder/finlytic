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

export interface CategoryDto {
  id: string;
  name: string;
  color: string;
  type: string;
}

// Fallback emoji/bg map สำหรับ icon ใน transaction list
// Keyed by category name (partial match) — ไม่ใช่สำหรับ business logic
export const CATEGORY_ICON_MAP: Record<string, { emoji: string; bg: string }> = {
  'อาหาร':     { emoji: '🍜', bg: 'rgba(249,115,22,0.12)' },
  'เดินทาง':   { emoji: '🚗', bg: 'rgba(59,130,246,0.12)' },
  'ที่อยู่':   { emoji: '🏠', bg: 'rgba(139,92,246,0.12)' },
  'ช้อปปิ้ง':  { emoji: '🛍', bg: 'rgba(236,72,153,0.12)' },
  'บันเทิง':   { emoji: '🎬', bg: 'rgba(245,158,11,0.12)' },
  'สุขภาพ':    { emoji: '🏥', bg: 'rgba(16,185,129,0.12)' },
  'การศึกษา':  { emoji: '📚', bg: 'rgba(99,102,241,0.12)' },
  'เงินเดือน': { emoji: '💰', bg: 'rgba(34,197,94,0.12)' },
  'รายได้':    { emoji: '💼', bg: 'rgba(132,204,22,0.12)' },
};

// Kept for backwards compat (filter bar icons) but no longer used for save logic
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
