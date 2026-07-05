import type { Bill } from '../types';

function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/**
 * Placeholder upcoming payments — there is no Bill model or `/bills`
 * endpoint on the backend yet (see types.ts Bill for the intended shape).
 * This is the one section of the dashboard that isn't backed by real data;
 * everything else (accounts, transactions, goals) comes from the API.
 */
export const mockBills: Bill[] = [
  {
    id: 'mock-bill-1',
    name: 'Visa Credit Card',
    category: 'credit_card',
    amount: 342.18,
    dueDate: daysFromNow(3),
    isAutopay: false,
  },
  {
    id: 'mock-bill-2',
    name: 'Hydro & Utilities',
    category: 'utility',
    amount: 87.5,
    dueDate: daysFromNow(6),
    isAutopay: true,
  },
  {
    id: 'mock-bill-3',
    name: 'Netflix',
    category: 'subscription',
    amount: 20.99,
    dueDate: daysFromNow(9),
    isAutopay: true,
  },
  {
    id: 'mock-bill-4',
    name: 'Scheduled Transfer to Savings',
    category: 'transfer',
    amount: 200,
    dueDate: daysFromNow(14),
    isAutopay: true,
  },
];
