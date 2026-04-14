export type TransactionType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  categoryId: string;
  amount: number;
  description: string;
  date: string; // ISO string
  type: TransactionType;
  paidBy?: string;
}

export interface AppData {
  categories: Category[];
  transactions: Transaction[];
}
