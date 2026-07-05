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
  const amountColor = isCredit ? colors.positive : colors.negative;

  return (
    <View style={styles.row}>
      <View style={styles.iconWrapper}>
        <Ionicons name={iconForCategory(transaction.category)} size={18} color={colors.accentGold} />
      </View>
      <View style={styles.details}>
        <Text style={styles.merchant} numberOfLines={1}>
          {transaction.merchantName}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {formatDateTime(transaction.createdAt)} · {transaction.category}
        </Text>
      </View>
      <Text style={[styles.amount, { color: amountColor }]}>
        {amountPrefix}${Math.abs(transaction.amount).toFixed(2)}
      </Text>
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
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  amount: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
