import api from './api';
import type { Account, CreateAccountPayload } from '../types';

export async function createAccount(payload: CreateAccountPayload): Promise<Account> {
  const { data } = await api.post<Account>('/accounts', payload);
  return data;
}
