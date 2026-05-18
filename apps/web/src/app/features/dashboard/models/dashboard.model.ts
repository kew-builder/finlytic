export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  net: number;
  topCategoryName: string | null;
  topCategoryAmount: number | null;
}

export interface CategorySummary {
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  total: number;
  percentage: number;
}

export interface SpendingTrend {
  year: number;
  month: number;
  label: string;
  income: number;
  expenses: number;
}

export interface BudgetVsActual {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  budgetAmount: number;
  actualSpent: number;
  percentage: number;
  isOverBudget: boolean;
}

export interface Forecast {
  year: number;
  month: number;
  label: string;
  predictedIncome: number;
  predictedExpenses: number;
  confidence: number;
}

export type PeriodFilter = 'month' | '3months' | '6months';
