import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';
import SpendingDonutChart from './SpendingDonutChart';
import type { Transaction } from '../types';

interface InsightsCardProps {
  transactions: Transaction[];
}

function isThisMonth(isoDate: string): boolean {
  const date = new Date(isoDate);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export default function InsightsCard({ transactions }: InsightsCardProps) {
  const { monthlySpending, monthlyIncome, savingsThisMonth, thisMonthTransactions } = useMemo(() => {
    const thisMonth = transactions.filter((t) => isThisMonth(t.createdAt));

    const spending = thisMonth
      .filter((t) => t.type === 'DEBIT')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const income = thisMonth
      .filter((t) => t.type === 'CREDIT')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      monthlySpending: spending,
      monthlyIncome: income,
      savingsThisMonth: Math.max(income - spending, 0),
      thisMonthTransactions: thisMonth,
    };
  }, [transactions]);

  return (
    <View style={styles.wrapper}>
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
      </View>

      <SpendingDonutChart transactions={thisMonthTransactions} title="Spending by category" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.md,
  },
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
});
