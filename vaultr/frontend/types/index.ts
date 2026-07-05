export type AccountType = 'SAVINGS' | 'CHEQUING' | 'TFSA';

export type TransactionType = 'CREDIT' | 'DEBIT';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface Account {
  id: string;
  userId: string;
  type: AccountType;
  balance: number;
  name: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  userId: string;
  amount: number;
  type: TransactionType;
  category: string;
  merchantName: string;
  description?: string | null;
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  linkedAccountId?: string | null;
  deadline?: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

/**
 * Upcoming bill / scheduled payment shown on the dashboard. There is no
 * backend model for this yet (see constants/mockBills.ts) — this type
 * documents the shape a future `/bills` endpoint should return.
 */
export interface Bill {
  id: string;
  name: string;
  category: 'credit_card' | 'utility' | 'subscription' | 'loan' | 'transfer';
  amount: number;
  dueDate: string;
  isAutopay: boolean;
}
