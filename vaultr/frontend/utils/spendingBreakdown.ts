import { colors } from '../constants/theme';
import type { Transaction } from '../types';

// A type alias (not an interface) so it satisfies Victory Native's
// `Record<string, unknown>` data constraint — interfaces aren't assignable to
// it because of declaration merging, type aliases are.
export type SpendingSlice = {
  category: string;
  total: number;
  /** 0–100 */
  percent: number;
  color: string;
};

// Gold-to-neutral gradation so the chart stays within the obsidian + gold
// theme rather than turning into a rainbow of arbitrary category colors.
const CATEGORY_COLORS = [
  colors.accentGold,
  '#e3c878',
  '#a9852f',
  '#8f7a4a',
  colors.negative,
  colors.textMuted,
  '#3d3d3d',
];

// Caps the number of slices so the chart/legend stay readable even when the
// underlying data has many distinct category strings (seeded demo data has
// 10+) — the smallest ones fold into a single "Other" slice.
const MAX_SLICES = 6;

/**
 * Aggregates spending (DEBIT transactions only — income/deposits are
 * excluded) by category, sorted largest first, with the smallest categories
 * beyond `MAX_SLICES` folded into "Other". Returns [] when there's no
 * spending to show.
 */
export function computeSpendingBreakdown(transactions: Pick<Transaction, 'type' | 'category' | 'amount'>[]): SpendingSlice[] {
  const totalsByCategory = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== 'DEBIT') continue;
    const key = t.category?.trim() || 'Other';
    totalsByCategory.set(key, (totalsByCategory.get(key) ?? 0) + Math.abs(t.amount));
  }

  let entries = Array.from(totalsByCategory.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  if (entries.length > MAX_SLICES) {
    const top = entries.slice(0, MAX_SLICES - 1);
    const rest = entries.slice(MAX_SLICES - 1);
    const otherTotal = rest.reduce((sum, e) => sum + e.total, 0);

    const existingOtherIndex = top.findIndex((e) => e.category.toLowerCase() === 'other');
    if (existingOtherIndex >= 0) {
      top[existingOtherIndex] = {
        category: top[existingOtherIndex].category,
        total: top[existingOtherIndex].total + otherTotal,
      };
    } else {
      top.push({ category: 'Other', total: otherTotal });
    }
    entries = top.sort((a, b) => b.total - a.total);
  }

  const grandTotal = entries.reduce((sum, e) => sum + e.total, 0);
  if (grandTotal <= 0) return [];

  return entries.map((e, i) => ({
    category: e.category,
    total: e.total,
    percent: (e.total / grandTotal) * 100,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));
}
