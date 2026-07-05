import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';
import ProgressBar from './ProgressBar';
import type { Transaction } from '../types';

interface InsightsCardProps {
  transactions: Transaction[];
}

interface CategoryTotal {
  category: string;
  total: number;
}

function isThisMonth(isoDate: string): boolean {
  const date = new Date(isoDate);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export default function InsightsCard({ transactions }: InsightsCardProps) {
  const { monthlySpending, monthlyIncome, savingsThisMonth, topCategories } = useMemo(() => {
    const thisMonth = transactions.filter((t) => isThisMonth(t.createdAt));

    const spending = thisMonth
      .filter((t) => t.type === 'DEBIT')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const income = thisMonth
      .filter((t) => t.type === 'CREDIT')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const byCategory = new Map<string, number>();
    for (const t of thisMonth) {
      if (t.type !== 'DEBIT') continue;
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + Math.abs(t.amount));
    }
    const categories: CategoryTotal[] = Array.from(byCategory.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);

    return {
      monthlySpending: spending,
      monthlyIncome: income,
      savingsThisMonth: Math.max(income - spending, 0),
      topCategories: categories,
    };
  }, [transactions]);

  const maxCategoryTotal = topCategories[0]?.total ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Spent</Text>
          <Text style={[styles.summaryValue, { color: colors.negative }]}>${monthlySpending.toFixed(0)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryValue, { color: colors.positive }]}>${monthlyIncome.toFixed(0)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Saved</Text>
          <Text style={[styles.summaryValue, { color: colors.accentGold }]}>${savingsThisMonth.toFixed(0)}</Text>
        </View>
      </View>

      {topCategories.length > 0 ? (
        <View style={styles.categories}>
          <Text style={styles.categoriesLabel}>Spending by category</Text>
          {topCategories.map((item) => (
            <View key={item.category} style={styles.categoryRow}>
              <Text style={styles.categoryName} numberOfLines={1}>
                {item.category}
              </Text>
              <View style={styles.categoryBarWrapper}>
                <ProgressBar
                  progress={maxCategoryTotal > 0 ? item.total / maxCategoryTotal : 0}
                  color={colors.accentGold}
                  height={6}
                />
              </View>
              <Text style={styles.categoryAmount}>${item.total.toFixed(0)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>No spending recorded this month yet.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs,
  },
  categories: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  categoriesLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryName: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    width: 90,
    textTransform: 'capitalize',
  },
  categoryBarWrapper: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  categoryAmount: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    width: 50,
    textAlign: 'right',
  },
  empty: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginTop: spacing.md,
  },
});
