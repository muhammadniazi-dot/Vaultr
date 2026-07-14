import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../constants/theme';
import CircularProgressRing from './CircularProgressRing';
import { projectGoalCompletion } from '../utils/goalProjection';
import { checkGoalMilestone } from '../services/goalMilestones';
import type { Account, AccountType, Goal } from '../types';

interface GoalCardProps {
  goal: Goal;
  /** Used to resolve `goal.linkedAccountId` to a human-readable name/type. */
  accounts?: Account[];
}

const LABELS_BY_TYPE: Record<AccountType, string> = {
  SAVINGS: 'Savings',
  CHEQUING: 'Chequing',
  TFSA: 'TFSA',
  CREDIT_CARD: 'Credit Card',
};

export default function GoalCard({ goal, accounts = [] }: GoalCardProps) {
  const progress = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
  const progressPercent = Math.round(Math.min(progress, 1) * 100);
  const isComplete = goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount;
  const linkedAccount = accounts.find((a) => a.id === goal.linkedAccountId) ?? null;
  const projection = projectGoalCompletion(goal);

  // Fires (and persists) milestone haptics whenever this goal's own progress
  // changes — e.g. after a deposit/transfer bumps currentAmount — not on
  // every unrelated re-render, and not again for ground already covered.
  const lastCheckedPercent = useRef<number | null>(null);
  useEffect(() => {
    if (lastCheckedPercent.current === progressPercent) return;
    lastCheckedPercent.current = progressPercent;
    checkGoalMilestone(goal.id, progressPercent).catch(() => {});
  }, [goal.id, progressPercent]);

  return (
    <View style={[styles.card, isComplete && styles.cardComplete]}>
      <View style={styles.row}>
        <CircularProgressRing progress={progress} size={56} strokeWidth={5}>
          {isComplete ? (
            <Ionicons name="checkmark" size={20} color={colors.accentGold} />
          ) : (
            <Text style={styles.percentText}>{progressPercent}%</Text>
          )}
        </CircularProgressRing>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Ionicons name="flag-outline" size={14} color={colors.accentGold} />
            <Text style={styles.name} numberOfLines={1}>
              {goal.name}
            </Text>
          </View>
          {linkedAccount ? (
            <Text style={styles.linkedAccount} numberOfLines={1}>
              {LABELS_BY_TYPE[linkedAccount.type] ?? linkedAccount.name} · {linkedAccount.name}
            </Text>
          ) : null}
          <View style={styles.amountsRow}>
            <Text style={styles.currentAmount}>${goal.currentAmount.toFixed(2)}</Text>
            <Text style={styles.targetAmount}> of ${goal.targetAmount.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.projectionRow, isComplete && styles.projectionRowComplete]}>
        <Ionicons
          name={isComplete ? 'trophy-outline' : 'calendar-outline'}
          size={13}
          color={isComplete ? colors.accentGold : colors.textMuted}
        />
        <Text style={[styles.projectionText, isComplete && styles.projectionTextComplete]} numberOfLines={1}>
          {projection.label}
        </Text>
      </View>
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
  cardComplete: {
    borderColor: colors.accentGoldSoft,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  percentText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fontFamily,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fontFamily,
    flexShrink: 1,
  },
  linkedAccount: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
    fontFamily: typography.fontFamily,
  },
  amountsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.sm,
  },
  currentAmount: {
    color: colors.accentGold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fontFamily,
  },
  targetAmount: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily,
  },
  projectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  projectionRowComplete: {
    borderTopColor: colors.accentGoldSoft,
  },
  projectionText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily,
    flexShrink: 1,
  },
  projectionTextComplete: {
    color: colors.accentGold,
    fontWeight: typography.weights.semibold,
  },
});
