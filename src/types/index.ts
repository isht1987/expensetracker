export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
}

export interface Expense {
  id: number;
  category: number;
  category_name?: string;
  amount: string;
  date: string;
  description?: string;
  receipt_image?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseFormData {
  category: number;
  amount: string;
  date: string;
  description?: string;
  receipt_image?: File | null;
}

export interface DashboardStats {
  total_expenses: number;
  total_amount: string;
  monthly_total: string;
  category_breakdown: Array<{
    category: string;
    total: string;
    count: number;
  }>;
}
