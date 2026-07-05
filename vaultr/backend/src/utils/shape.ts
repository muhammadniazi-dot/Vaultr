import type { Account, Transaction } from '@prisma/client';

/**
 * Shapes a DB Account row for API responses. Keeps the original fields the
 * existing frontend already relies on (id, userId, type, balance, name,
 * createdAt) and adds the richer fields the dashboard also wants.
 * `availableBalance` mirrors `balance` — there's no pending-hold concept in
 * this demo app yet, so the two are always equal today.
 */
export function shapeAccount(account: Account) {
  return {
    id: account.id,
    userId: account.userId,
    type: account.type,
    name: account.name,
    accountNumberLast4: account.accountNumberLast4,
    balance: account.balance,
    availableBalance: account.balance,
    currency: account.currency,
    institutionName: account.institutionName,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

/**
 * Shapes a DB Transaction row for API responses. `type` intentionally stays
 * CREDIT/DEBIT (the existing frontend already switches on these values);
 * `direction` is the new inflow/outflow field, `title`/`date` are friendly
 * aliases of merchantName/createdAt, and `status` is lowercased to match the
 * pending/completed/failed vocabulary requested for the dashboard.
 */
export function shapeTransaction(transaction: Transaction) {
  return {
    id: transaction.id,
    accountId: transaction.accountId,
    userId: transaction.userId,
    type: transaction.type,
    direction: transaction.type === 'CREDIT' ? 'inflow' : 'outflow',
    title: transaction.merchantName,
    merchantName: transaction.merchantName,
    description: transaction.description,
    category: transaction.category,
    amount: transaction.amount,
    currency: transaction.currency,
    status: transaction.status.toLowerCase(),
    recipient: transaction.recipient,
    date: transaction.createdAt,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
}
