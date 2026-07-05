import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../constants/theme';
import type { Account, AccountType } from '../types';

interface AccountCardProps {
  account: Account;
  onPress?: (account: Account) => void;
  hasRecentActivity?: boolean;
}

const LABELS_BY_TYPE: Record<AccountType, string> = {
  SAVINGS: 'Savings',
  CHEQUING: 'Chequing',
  TFSA: 'TFSA',
};

function AccountIcon({ type }: { type: AccountType }) {
  const size = 20;
  const color = colors.accentGold;
  switch (type) {
    case 'SAVINGS':
      return <MaterialCommunityIcons name="piggy-bank-outline" size={size} color={color} />;
    case 'TFSA':
      return <Ionicons name="trending-up-outline" size={size} color={color} />;
    case 'CHEQUING':
    default:
      return <Ionicons name="card-outline" size={size} color={color} />;
  }
}

function lastFourFromId(id: string): string {
  const digits = id.replace(/[^0-9]/g, '');
  const source = digits.length >= 4 ? digits : id;
  return source.slice(-4).toUpperCase();
}

export default function AccountCard({ account, hasRecentActivity = false }: AccountCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          <AccountIcon type={account.type} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.type}>{LABELS_BY_TYPE[account.type]}</Text>
          <Text style={styles.name}>{account.name}</Text>
        </View>
        {hasRecentActivity ? <View style={styles.activityDot} /> : null}
      </View>
      <Text style={styles.balance}>${account.balance.toFixed(2)}</Text>
      <Text style={styles.accountNumber}>•••• {lastFourFromId(account.id)}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: radius.button,
    backgroundColor: colors.accentGoldFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  type: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginTop: 2,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentGold,
  },
  balance: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.md,
  },
  accountNumber: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
    letterSpacing: 1,
  },
});
