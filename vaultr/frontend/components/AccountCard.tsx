import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
  CREDIT_CARD: 'Credit Card',
};

function AccountIcon({ type }: { type: AccountType }) {
  const size = 20;
  const color = colors.accentGold;
  switch (type) {
    case 'SAVINGS':
      return <MaterialCommunityIcons name="piggy-bank-outline" size={size} color={color} />;
    case 'TFSA':
      return <Ionicons name="trending-up-outline" size={size} color={color} />;
    case 'CREDIT_CARD':
      return <MaterialCommunityIcons name="credit-card-outline" size={size} color={color} />;
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

export default function AccountCard({ account, onPress, hasRecentActivity = false }: AccountCardProps) {
  const isCreditCard = account.type === 'CREDIT_CARD';

  const content = (
    <>
      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          <AccountIcon type={account.type} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.type}>{LABELS_BY_TYPE[account.type]}</Text>
          <Text style={styles.name}>{account.name}</Text>
        </View>
        {hasRecentActivity ? <View style={styles.activityDot} /> : null}
        {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
      </View>
      {isCreditCard ? <Text style={styles.balanceLabel}>Current balance</Text> : null}
      <Text style={styles.balance}>${account.balance.toFixed(2)}</Text>
      {isCreditCard && account.availableCredit != null ? (
        <Text style={styles.availableCredit}>Available: ${account.availableCredit.toFixed(2)}</Text>
      ) : null}
      <Text style={styles.accountNumber}>•••• {lastFourFromId(account.id)}</Text>
    </>
  );

  if (!onPress) {
    return <View style={styles.card}>{content}</View>;
  }

  return (
    <Pressable
      onPress={() => onPress(account)}
      accessibilityRole="button"
      accessibilityLabel={`${LABELS_BY_TYPE[account.type]} account, balance $${account.balance.toFixed(2)}`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {content}
    </Pressable>
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
  cardPressed: {
    borderColor: colors.accentGold,
    backgroundColor: colors.accentGoldFaint,
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
  balanceLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: spacing.md,
  },
  balance: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.md,
  },
  availableCredit: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  accountNumber: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
    letterSpacing: 1,
  },
});
