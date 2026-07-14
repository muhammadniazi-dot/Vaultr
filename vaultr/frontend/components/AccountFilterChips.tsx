import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';
import type { Account, AccountType } from '../types';

interface AccountFilterChipsProps {
  accounts: Account[];
  selectedAccountId: string | null;
  onSelect: (accountId: string | null) => void;
}

const SHORT_LABEL_BY_TYPE: Record<AccountType, string> = {
  CHEQUING: 'Chequing',
  SAVINGS: 'Savings',
  TFSA: 'TFSA',
  CREDIT_CARD: 'Credit Card',
};

interface ChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

function Chip({ label, isSelected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      style={[styles.chip, isSelected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export default function AccountFilterChips({ accounts, selectedAccountId, onSelect }: AccountFilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <Chip label="All" isSelected={selectedAccountId === null} onPress={() => onSelect(null)} />
      {accounts.map((account) => (
        <Chip
          key={account.id}
          label={SHORT_LABEL_BY_TYPE[account.type] ?? account.name}
          isSelected={selectedAccountId === account.id}
          onPress={() => onSelect(account.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.accentGold,
    backgroundColor: colors.accentGoldSoft,
  },
  chipText: {
    color: colors.textMuted,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  chipTextSelected: {
    color: colors.accentGold,
    fontWeight: typography.weights.semibold,
  },
});
