import { TransactionType } from '@prisma/client';

export type TransactionDirection = 'inflow' | 'outflow';

interface NormalizedType {
  dbType: TransactionType;
  direction: TransactionDirection;
}

/**
 * Accepts either the canonical stored enum (CREDIT/DEBIT) or the friendlier
 * vocabulary the mobile client may send (deposit/withdrawal/transfer/payment)
 * and normalizes both to the same { dbType, direction } shape. Returns null
 * for anything unrecognized so the route can respond with a clean 400.
 */
export function normalizeTransactionType(input: string): NormalizedType | null {
  const key = input.trim().toUpperCase();

  switch (key) {
    case 'CREDIT':
    case 'DEPOSIT':
      return { dbType: 'CREDIT', direction: 'inflow' };
    case 'DEBIT':
    case 'WITHDRAWAL':
    case 'TRANSFER':
    case 'PAYMENT':
      return { dbType: 'DEBIT', direction: 'outflow' };
    default:
      return null;
  }
}
