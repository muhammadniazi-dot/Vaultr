import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../constants/theme';
import type { Transaction } from '../types';

interface TransactionRowProps {
  transaction: Transaction;
}

function iconForCategory(category: string): keyof typeof Ionicons.glyphMap {
  const key = category.toLowerCase();
  if (key.includes('grocer')) return 'basket-outline';
  if (key.includes('dining') || key.includes('restaurant') || key.includes('food')) return 'restaurant-outline';
  if (key.includes('transfer') || key.includes('e-transfer')) return 'swap-horizontal-outline';
  if (key.includes('transport') || key.includes('gas') || key.includes('fuel')) return 'car-outline';
  if (key.includes('shopping') || key.includes('retail')) return 'bag-outline';
  if (key.includes('bill') || key.includes('utilit')) return 'flash-outline';
  if (key.includes('salary') || key.includes('payroll') || key.includes('income')) return 'cash-outline';
  if (key.includes('entertain') || key.includes('subscription')) return 'play-circle-outline';
  if (key.includes('rent')) return 'home-outline';
  if (key.includes('coffee')) return 'cafe-outline';
  return 'ellipse-outline';
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function TransactionRow({ transaction }: TransactionRowProps) {
  const isCredit = transaction.type === 'CREDIT';
  const amountPrefix = isCredit ? '+' : '-';
  // Explicitly gold for incoming, muted gray for outgoing — this row's own
  // choice, kept separate from the shared `colors.positive` token (green)
  // used elsewhere on the dashboard, so this doesn't ripple into other
  // screens that rely on that token meaning something else.
  const amountColor = isCredit ? colors.accentGold : colors.negative;
  const title = transaction.title ?? transaction.merchantName;
  const isPending = transaction.status === 'pending';
  const isFailed = transaction.status === 'failed';

  return (
    <View style={styles.row}>
      <View style={styles.iconWrapper}>
        <Ionicons name={iconForCategory(transaction.category)} size={18} color={colors.accentGold} />
      </View>
      <View style={styles.details}>
        <Text style={styles.merchant} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {formatDateTime(transaction.date ?? transaction.createdAt)} · {transaction.category}
        </Text>
      </View>
      <View style={styles.amountColumn}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {amountPrefix}${Math.abs(transaction.amount).toFixed(2)}
        </Text>
        {isPending || isFailed ? (
          <View style={[styles.statusPill, isFailed && styles.statusPillFailed]}>
            <Text style={[styles.statusText, isFailed && styles.statusTextFailed]}>
              {isFailed ? 'Failed' : 'Pending'}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: radius.button,
    backgroundColor: colors.accentGoldFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  details: {
    flex: 1,
  },
  merchant: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  meta: {
    color: colors.textMuted,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  amountColumn: {
    alignItems: 'flex-end',
  },
  amount: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  statusPill: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.accentGoldFaint,
  },
  statusPillFailed: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
  },
  statusText: {
    color: colors.accentGold,
    fontFamily: typography.fontFamily,
    fontSize: 10,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
  },
  statusTextFailed: {
    color: colors.danger,
  },
});
