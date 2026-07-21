import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { createAccount } from '../services/accounts';
import { friendlyError } from '../services/errors';
import api from '../services/api';
import AuthButton from '../components/AuthButton';
import type { Account, AccountType } from '../types';

type Step = 'type' | 'confirm' | 'success';

// Mirrors the backend's rule: at most one Chequing, Savings, or TFSA per
// user, but Credit Cards have no cap.
const SINGLE_INSTANCE_TYPES = new Set<AccountType>(['CHEQUING', 'SAVINGS', 'TFSA']);

interface AccountTypeOption {
  type: AccountType;
  title: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
}

const ICON_SIZE = 22;
const ICON_COLOR = colors.accentGold;

const ACCOUNT_TYPE_OPTIONS: AccountTypeOption[] = [
  {
    type: 'CHEQUING',
    title: 'Chequing Account',
    description: 'For everyday spending, bill payments, and debit purchases.',
    features: ['No minimum balance', 'Free e-transfers'],
    icon: <Ionicons name="card-outline" size={ICON_SIZE} color={ICON_COLOR} />,
  },
  {
    type: 'SAVINGS',
    title: 'Savings Account',
    description: "Set money aside and earn interest on what you don't spend.",
    features: ['Interest-bearing', 'No monthly fee'],
    icon: <MaterialCommunityIcons name="piggy-bank-outline" size={ICON_SIZE} color={ICON_COLOR} />,
  },
  {
    type: 'TFSA',
    title: 'TFSA / Investment Account',
    description: 'Tax-free growth for your long-term investments and savings.',
    features: ['Tax-free growth', 'Contribution room applies'],
    icon: <Ionicons name="trending-up-outline" size={ICON_SIZE} color={ICON_COLOR} />,
  },
  {
    type: 'CREDIT_CARD',
    title: 'Credit Card',
    description: 'Build credit and earn rewards on your everyday purchases.',
    features: ['Starting credit limit: $2,000.00', 'Starting balance: $0.00'],
    icon: <MaterialCommunityIcons name="credit-card-outline" size={ICON_SIZE} color={ICON_COLOR} />,
  },
];

export default function OpenAccountScreen() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [step, setStep] = useState<Step>('type');
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdAccount, setCreatedAccount] = useState<Account | null>(null);

  const [existingTypes, setExistingTypes] = useState<Set<AccountType>>(new Set());
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);

  // Used to grey out account types the user already holds (Chequing/Savings/
  // TFSA are capped at one each) so the type-selection step reflects the rule
  // up front instead of only erroring after the review step.
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<Account[]>('/accounts');
        setExistingTypes(new Set(data.map((a) => a.type)));
      } catch {
        // Non-fatal — worst case, an already-owned type stays selectable and
        // the backend's own check catches it on submit.
      } finally {
        setIsLoadingExisting(false);
      }
    })();
  }, []);

  const selectedOption = ACCOUNT_TYPE_OPTIONS.find((o) => o.type === selectedType) ?? null;

  const close = () => router.back();

  const selectType = (type: AccountType) => {
    if (SINGLE_INSTANCE_TYPES.has(type) && existingTypes.has(type)) return;
    setSelectedType(type);
    setSubmitError(null);
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (!selectedType) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const account = await createAccount({ type: selectedType });
      setCreatedAccount(account);
      setStep('success');
    } catch (err) {
      setSubmitError(friendlyError(err, 'Could not open your account. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTypeStep = () => {
    if (isLoadingExisting) {
      return <ActivityIndicator color={colors.accentGold} style={styles.center} />;
    }
    return (
      <>
        <Text style={styles.title}>Choose an account type</Text>
        <Text style={styles.subtitle}>Select the type of account you&apos;d like to open.</Text>

        <View style={styles.optionList}>
          {ACCOUNT_TYPE_OPTIONS.map((option) => {
            const isOwned = SINGLE_INSTANCE_TYPES.has(option.type) && existingTypes.has(option.type);
            return (
              <Pressable
                key={option.type}
                onPress={() => selectType(option.type)}
                disabled={isOwned}
                accessibilityRole="button"
                accessibilityState={{ disabled: isOwned }}
                accessibilityLabel={isOwned ? `${option.title}, already open` : `Open a ${option.title}`}
                style={({ pressed }) => [
                  styles.optionCard,
                  pressed && !isOwned && styles.optionCardPressed,
                  isOwned && styles.optionCardDisabled,
                ]}
              >
                <View style={styles.optionIconWrapper}>{option.icon}</View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>
                    {isOwned ? 'You already have this account.' : option.description}
                  </Text>
                </View>
                {isOwned ? (
                  <Ionicons name="checkmark-circle" size={18} color={colors.textMuted} />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                )}
              </Pressable>
            );
          })}
        </View>
      </>
    );
  };

  const renderConfirmStep = () => {
    if (!selectedOption) return null;
    return (
      <>
        <Text style={styles.title}>Review</Text>
        <Text style={styles.subtitle}>Double check the details before you open this account.</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.optionIconWrapper}>{selectedOption.icon}</View>
            <Text style={styles.summaryTitle}>{selectedOption.title}</Text>
          </View>
          <Text style={styles.summaryDescription}>{selectedOption.description}</Text>

          <View style={styles.divider} />

          {selectedOption.features.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.accentGold} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Currency</Text>
            <Text style={styles.summaryValue}>CAD</Text>
          </View>
        </View>

        {submitError ? (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Text style={styles.errorBannerText}>{submitError}</Text>
          </View>
        ) : null}

        <View style={styles.submitSpacing}>
          <AuthButton title="Open account" onPress={handleConfirm} loading={isSubmitting} />
        </View>
      </>
    );
  };

  const renderSuccessStep = () => {
    if (!createdAccount) return null;
    return (
      <View style={styles.successWrapper}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={40} color={colors.background} />
        </View>
        <Text style={styles.successTitle}>Account opened</Text>
        <Text style={styles.successSubtitle}>
          Your new {selectedOption?.title.toLowerCase()} is ready to use.
        </Text>

        <View style={styles.successBalanceCard}>
          <Text style={styles.successBalanceLabel}>{createdAccount.name}</Text>
          <Text style={styles.successBalanceValue}>${createdAccount.balance.toFixed(2)}</Text>
          <Text style={styles.successBalanceSub}>•••• {createdAccount.accountNumberLast4}</Text>
        </View>

        <View style={styles.footer}>
          <AuthButton title="Done" onPress={() => router.replace('/(tabs)')} />
          <Pressable
            style={styles.viewAccountButton}
            onPress={() => router.replace(`/account/${createdAccount.id}`)}
          >
            <Text style={styles.viewAccountButtonText}>View account</Text>
          </Pressable>
        </View>
      </View>
    );
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
        {step !== 'success' ? (
          <Pressable
            onPress={() => (step === 'type' ? close() : setStep('type'))}
            hitSlop={12}
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <Text style={styles.topBarTitle}>Open an account</Text>
        {step !== 'success' ? (
          <Pressable onPress={close} hitSlop={12} accessibilityLabel="Close">
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {step === 'type' && renderTypeStep()}
        {step === 'confirm' && renderConfirmStep()}
        {step === 'success' && renderSuccessStep()}
      </ScrollView>
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
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  center: {
    marginTop: spacing.xxxl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  optionList: {
    gap: spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  optionCardPressed: {
    borderColor: colors.accentGold,
    backgroundColor: colors.accentGoldFaint,
  },
  optionCardDisabled: {
    opacity: 0.5,
  },
  optionIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radius.button,
    backgroundColor: colors.accentGoldFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  optionDescription: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  summaryTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    flexShrink: 1,
  },
  summaryDescription: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginTop: spacing.md,
  },
  divider: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    marginVertical: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  featureText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    flexShrink: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  errorBanner: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.button,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  errorBannerText: {
    color: colors.danger,
    fontSize: typography.sizes.sm,
  },
  submitSpacing: {
    marginTop: spacing.xl,
  },
  successWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xxxl,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  successSubtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  successBalanceCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  successBalanceLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  successBalanceValue: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs,
  },
  successBalanceSub: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
    letterSpacing: 1,
  },
  footer: {
    marginTop: spacing.xxl,
    width: '100%',
    gap: spacing.md,
  },
  viewAccountButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  viewAccountButtonText: {
    color: colors.accentGold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
