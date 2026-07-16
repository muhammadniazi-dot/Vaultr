import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../constants/theme';
import SpendingDonutBody from './spendingChart/SpendingDonutBody';
import { computeSpendingBreakdown } from '../utils/spendingBreakdown';
import type { Transaction } from '../types';

interface SpendingDonutChartProps {
  transactions: Transaction[];
  title?: string;
}

/**
 * Spending-by-category donut chart. Only DEBIT (outgoing/spending)
 * transactions count — income/deposits are excluded, per the "spending"
 * framing. The ring itself is platform-split (see spendingChart/); this shell
 * handles the title, empty state, and the label/amount/percentage legend,
 * which are plain Views/Text and work identically everywhere.
 */
export default function SpendingDonutChart({ transactions, title = 'Spending by category' }: SpendingDonutChartProps) {
  const slices = useMemo(() => computeSpendingBreakdown(transactions), [transactions]);
  const totalSpent = useMemo(() => slices.reduce((sum, s) => sum + s.total, 0), [slices]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      {slices.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="pie-chart-outline" size={26} color={colors.textMuted} />
          <Text style={styles.emptyText}>No spending data yet.</Text>
        </View>
      ) : (
        <>
          <SpendingDonutBody slices={slices} totalSpent={totalSpent} />

          <View style={styles.legend}>
            {slices.map((slice) => (
              <View key={slice.category} style={styles.legendRow}>
                <View style={[styles.swatch, { backgroundColor: slice.color }]} />
                <Text style={styles.legendLabel} numberOfLines={1}>
                  {slice.category}
                </Text>
                <Text style={styles.legendPercent}>{slice.percent.toFixed(0)}%</Text>
                <Text style={styles.legendAmount}>${slice.total.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </>
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
  title: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.lg,
    fontFamily: typography.fontFamily,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily,
  },
  legend: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily,
  },
  legendPercent: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    width: 36,
    textAlign: 'right',
    fontFamily: typography.fontFamily,
  },
  legendAmount: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    width: 68,
    textAlign: 'right',
    fontFamily: typography.fontFamily,
  },
});
