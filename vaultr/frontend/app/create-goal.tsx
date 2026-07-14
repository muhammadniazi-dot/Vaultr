import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { createGoal } from '../services/goals';
import { friendlyError } from '../services/errors';
import AuthTextField from '../components/AuthTextField';
import AuthButton from '../components/AuthButton';
import type { Account, AccountType } from '../types';

const LABELS_BY_TYPE: Record<AccountType, string> = {
  SAVINGS: 'Savings',
  CHEQUING: 'Chequing',
  TFSA: 'TFSA',
  CREDIT_CARD: 'Credit Card',
};

function AccountIcon({ type }: { type: AccountType }) {
  const color = colors.accentGold;
  switch (type) {
    case 'SAVINGS':
      return <MaterialCommunityIcons name="piggy-bank-outline" size={20} color={color} />;
    case 'CREDIT_CARD':
      return <MaterialCommunityIcons name="credit-card-outline" size={20} color={color} />;
    case 'TFSA':
      return <Ionicons name="trending-up-outline" size={20} color={color} />;
    case 'CHEQUING':
    default:
      return <Ionicons name="card-outline" size={20} color={color} />;
  }
}

interface AccountRowProps {
  account: Account;
  isSelected: boolean;
  onPress: () => void;
}

function AccountRow({ account, isSelected, onPress }: AccountRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Linked account: ${account.name}`}
      accessibilityState={{ selected: isSelected }}
      style={({ pressed }) => [styles.accountRow, (isSelected || pressed) && styles.accountRowSelected]}
    >
      <View style={styles.accountRowIcon}>
        <AccountIcon type={account.type} />
      </View>
      <View style={styles.accountRowText}>
        <Text style={styles.accountRowName}>{account.name}</Text>
        <Text style={styles.accountRowType}>
          {LABELS_BY_TYPE[account.type]} · ${account.balance.toFixed(2)}
        </Text>
      </View>
      {isSelected ? <Ionicons name="checkmark-circle" size={22} color={colors.accentGold} /> : null}
    </Pressable>
  );
}

interface FieldErrors {
  name?: string;
  targetAmount?: string;
  linkedAccountId?: string;
  currentAmount?: string;
  monthlyContribution?: string;
}

export default function CreateGoalScreen() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [linkedAccountId, setLinkedAccountId] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<Account[]>('/accounts');
        setAccounts(data);
      } catch (err) {
        setLoadError(friendlyError(err, "We couldn't load your accounts right now."));
      } finally {
        setIsLoadingAccounts(false);
      }
    })();
  }, []);

  const handleSubmit = async () => {
    setSubmitError(null);

    const numericTarget = Number(targetAmount);
    const numericCurrent = currentAmount.trim() ? Number(currentAmount) : 0;
    const numericContribution = monthlyContribution.trim() ? Number(monthlyContribution) : undefined;

    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = 'Goal name is required.';
    if (!targetAmount.trim() || !Number.isFinite(numericTarget) || numericTarget <= 0) {
      errors.targetAmount = 'Enter a target amount greater than $0.';
    }
    if (!linkedAccountId) errors.linkedAccountId = 'Choose an account to link this goal to.';
    if (currentAmount.trim() && (!Number.isFinite(numericCurrent) || numericCurrent < 0)) {
      errors.currentAmount = 'Enter a valid amount.';
    } else if (Number.isFinite(numericTarget) && numericCurrent > numericTarget) {
      errors.currentAmount = 'Current amount cannot exceed the target amount.';
    }
    if (monthlyContribution.trim() && (!Number.isFinite(numericContribution!) || numericContribution! < 0)) {
      errors.monthlyContribution = 'Enter a valid amount.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      await createGoal({
        name: name.trim(),
        targetAmount: numericTarget,
        linkedAccountId: linkedAccountId!,
        currentAmount: numericCurrent,
        monthlyContribution: numericContribution,
      });
      router.back();
    } catch (err) {
      setSubmitError(friendlyError(err, 'Could not create your goal. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Close">
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </Pressable>
        <Text style={styles.topBarTitle}>New goal</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? spacing.xl : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {isLoadingAccounts ? (
            <ActivityIndicator color={colors.accentGold} style={styles.center} />
          ) : loadError ? (
            <Text style={styles.errorBannerText}>{loadError}</Text>
          ) : (
            <>
              <AuthTextField
                label="Goal name"
                placeholder="e.g. Emergency fund"
                value={name}
                editable={!isSubmitting}
                error={fieldErrors.name}
                onChangeText={setName}
              />

              <AuthTextField
                label="Target amount (CAD)"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={targetAmount}
                editable={!isSubmitting}
                error={fieldErrors.targetAmount}
                onChangeText={setTargetAmount}
              />

              <Text style={styles.fieldLabel}>Linked account</Text>
              {fieldErrors.linkedAccountId ? (
                <Text style={styles.fieldError}>{fieldErrors.linkedAccountId}</Text>
              ) : null}
              <View style={styles.accountList}>
                {accounts.map((account) => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    isSelected={linkedAccountId === account.id}
                    onPress={() => setLinkedAccountId(account.id)}
                  />
                ))}
              </View>

              <View style={styles.spacedField}>
                <AuthTextField
                  label="Current amount saved (optional)"
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={currentAmount}
                  editable={!isSubmitting}
                  error={fieldErrors.currentAmount}
                  onChangeText={setCurrentAmount}
                />
              </View>

              <AuthTextField
                label="Monthly contribution (optional)"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={monthlyContribution}
                editable={!isSubmitting}
                error={fieldErrors.monthlyContribution}
                onChangeText={setMonthlyContribution}
              />
              <Text style={styles.hint}>
                Adding a monthly contribution lets us project a completion date for this goal.
              </Text>

              {submitError ? (
                <View style={styles.errorBanner} accessibilityRole="alert">
                  <Text style={styles.errorBannerText}>{submitError}</Text>
                </View>
              ) : null}

              <View style={styles.submitSpacing}>
                <AuthButton title="Create goal" onPress={handleSubmit} loading={isSubmitting} />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  topBarTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  keyboardAvoider: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  center: {
    marginTop: spacing.xxxl,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  fieldError: {
    color: colors.danger,
    fontSize: typography.sizes.xs,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  accountList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  accountRowSelected: {
    borderColor: colors.accentGold,
    backgroundColor: colors.accentGoldFaint,
  },
  accountRowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.button,
    backgroundColor: colors.accentGoldFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  accountRowText: {
    flex: 1,
  },
  accountRowName: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  accountRowType: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  spacedField: {
    marginTop: spacing.sm,
  },
  hint: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  errorBanner: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.button,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    color: colors.danger,
    fontSize: typography.sizes.sm,
  },
  submitSpacing: {
    marginTop: spacing.sm,
  },
});
