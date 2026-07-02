import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../constants/theme';
import type { Transaction } from '../types';

interface TransactionRowProps {
  transaction: Transaction;
}

export default function TransactionRow({ transaction }: TransactionRowProps) {
  const isCredit = transaction.type === 'CREDIT';
  const amountPrefix = isCredit ? '+' : '-';
  const amountColor = isCredit ? colors.positive : colors.negative;

  return (
    <View style={styles.row}>
      <View style={styles.details}>
        <Text style={styles.merchant}>{transaction.merchantName}</Text>
        <Text style={styles.category}>{transaction.category}</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  details: {
    flex: 1,
  },
  merchant: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  category: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  amount: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
