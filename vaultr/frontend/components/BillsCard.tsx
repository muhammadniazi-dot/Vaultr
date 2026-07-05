import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../constants/theme';
import type { Bill } from '../types';

interface BillsCardProps {
  bills: Bill[];
}

const ICONS_BY_CATEGORY: Record<Bill['category'], keyof typeof Ionicons.glyphMap> = {
  credit_card: 'card-outline',
  utility: 'flash-outline',
  subscription: 'repeat-outline',
  loan: 'home-outline',
  transfer: 'swap-horizontal-outline',
};

function formatDueDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const days = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 7) return `Due in ${days} days`;
  return `Due ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

export default function BillsCard({ bills }: BillsCardProps) {
  if (bills.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.empty}>No upcoming bills.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {bills.map((bill, index) => (
        <View key={bill.id} style={[styles.row, index === bills.length - 1 && styles.rowLast]}>
          <View style={styles.iconWrapper}>
            <Ionicons name={ICONS_BY_CATEGORY[bill.category]} size={18} color={colors.accentGold} />
          </View>
          <View style={styles.details}>
            <Text style={styles.name}>{bill.name}</Text>
            <Text style={styles.due}>
              {formatDueDate(bill.dueDate)}
              {bill.isAutopay ? ' · Autopay' : ''}
            </Text>
          </View>
          <Text style={styles.amount}>${bill.amount.toFixed(2)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: radius.button,
    backgroundColor: colors.accentGoldFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  details: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  due: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  amount: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  empty: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    paddingVertical: spacing.md,
  },
});
