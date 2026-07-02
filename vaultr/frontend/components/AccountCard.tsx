import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';
import type { Account } from '../types';

interface AccountCardProps {
  account: Account;
  onPress?: (account: Account) => void;
}

export default function AccountCard({ account }: AccountCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.type}>{account.type}</Text>
      <Text style={styles.name}>{account.name}</Text>
      <Text style={styles.balance}>${account.balance.toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  type: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    textTransform: 'uppercase',
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.xs,
  },
  balance: {
    color: colors.positive,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.sm,
  },
});
