import api from './api';
import type { CreateTransactionResponse, CreateTransferResponse } from '../types';

/** Moves money between two of the caller's own accounts, atomically on the backend. */
export async function createTransfer(
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  note?: string
): Promise<CreateTransferResponse> {
  const { data } = await api.post<CreateTransferResponse>('/transfers', {
    fromAccountId,
    toAccountId,
    amount,
    note,
  });
  return data;
}

/** Adds simulated funds to one of the caller's accounts (no source account needed). */
export async function createDeposit(
  accountId: string,
  amount: number,
  note?: string
): Promise<CreateTransactionResponse> {
  const { data } = await api.post<CreateTransactionResponse>('/transactions', {
    accountId,
    type: 'deposit',
    amount,
    title: 'Deposit',
    description: note,
  });
  return data;
}
