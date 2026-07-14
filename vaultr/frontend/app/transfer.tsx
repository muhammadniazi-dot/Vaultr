import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { createDeposit, createTransfer } from '../services/transfers';
import { friendlyError } from '../services/errors';
import AuthButton from '../components/AuthButton';
import AuthTextField from '../components/AuthTextField';
import type { Account, AccountType, CreateTransactionResponse, CreateTransferResponse } from '../types';

type Mode = 'transfer' | 'deposit';
type Step = 'action' | 'accounts' | 'amount' | 'confirm' | 'success';

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
    case 'TFSA':
      return <Ionicons name="trending-up-outline" size={20} color={color} />;
    case 'CREDIT_CARD':
      return <MaterialCommunityIcons name="credit-card-outline" size={20} color={color} />;
    case 'CHEQUING':
    default:
      return <Ionicons name="card-outline" size={20} color={color} />;
  }
}

interface SelectableAccountRowProps {
  account: Account;
  isSelected: boolean;
  onPress: () => void;
  listLabel: string;
}

function SelectableAccountRow({ account, isSelected, onPress, listLabel }: SelectableAccountRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${listLabel}: ${account.name}, balance $${account.balance.toFixed(2)}`}
      accessibilityState={{ selected: isSelected }}
      style={({ pressed }) => [
        styles.accountRow,
        (isSelected || pressed) && styles.accountRowSelected,
      ]}
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

export default function TransferScreen() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const params = useLocalSearchParams<{ mode?: string; fromAccountId?: string }>();
  const initialMode: Mode | null = params.mode === 'transfer' || params.mode === 'deposit' ? params.mode : null;

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode | null>(initialMode);
  const [step, setStep] = useState<Step>(initialMode ? 'accounts' : 'action');
  const [fromAccountId, setFromAccountId] = useState<string | null>(params.fromAccountId ?? null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [amountText, setAmountText] = useState('');
  const [note, setNote] = useState('');
  const [stepError, setStepError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [transferResult, setTransferResult] = useState<CreateTransferResponse | null>(null);
  const [depositResult, setDepositResult] = useState<CreateTransactionResponse | null>(null);

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

  const fromAccount = accounts.find((a) => a.id === fromAccountId) ?? null;
  const toAccount = accounts.find((a) => a.id === toAccountId) ?? null;
  const numericAmount = Number(amountText);
  const isAmountValid = amountText.trim().length > 0 && Number.isFinite(numericAmount) && numericAmount > 0;

  const close = () => router.back();

  const goToAction = (nextMode: Mode) => {
    setMode(nextMode);
    setStepError(null);
    setStep('accounts');
  };

  const goToAmount = () => {
    setStepError(null);
    if (mode === 'transfer' && (!fromAccountId || !toAccountId)) {
      setStepError('Choose both a source and destination account.');
      return;
    }
    if (mode === 'transfer' && fromAccountId === toAccountId) {
      setStepError('Choose two different accounts.');
      return;
    }
    if (mode === 'deposit' && !toAccountId) {
      setStepError('Choose an account to deposit into.');
      return;
    }
    setStep('amount');
  };

  const goToConfirm = () => {
    setStepError(null);
    if (!isAmountValid) {
      setStepError('Enter a valid amount greater than $0.');
      return;
    }
    if (mode === 'transfer' && fromAccount && numericAmount > fromAccount.balance) {
      setStepError(`Insufficient funds in ${fromAccount.name}.`);
      return;
    }
    setStep('confirm');
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'transfer' && fromAccountId && toAccountId) {
        const result = await createTransfer(fromAccountId, toAccountId, numericAmount, note || undefined);
        setTransferResult(result);
      } else if (mode === 'deposit' && toAccountId) {
        const result = await createDeposit(toAccountId, numericAmount, note || undefined);
        setDepositResult(result);
      } else {
        throw new Error('Missing account selection.');
      }
      setStep('success');
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Haptics aren't available on every platform (e.g. web) — never let
        // that block the success screen from showing.
      }
    } catch (err) {
      setSubmitError(
        friendlyError(err, mode === 'transfer' ? 'Could not complete the transfer.' : 'Could not complete the deposit.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAction = () => (
    <>
      <Text style={styles.title}>Move money</Text>
      <Text style={styles.subtitle}>Choose what you&apos;d like to do</Text>
      <Pressable
        style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
        onPress={() => goToAction('transfer')}
      >
        <Ionicons name="swap-horizontal-outline" size={22} color={colors.accentGold} />
        <View style={styles.actionCardText}>
          <Text style={styles.actionCardTitle}>Send / Transfer</Text>
          <Text style={styles.actionCardSubtitle}>Move money between your own accounts</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
        onPress={() => goToAction('deposit')}
      >
        <Ionicons name="add-circle-outline" size={22} color={colors.accentGold} />
        <View style={styles.actionCardText}>
          <Text style={styles.actionCardTitle}>Deposit</Text>
          <Text style={styles.actionCardSubtitle}>Add simulated funds to an account</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
    </>
  );

  const renderAccounts = () => (
    <>
      <Text style={styles.title}>{mode === 'transfer' ? 'Choose accounts' : 'Choose account'}</Text>
      <Text style={styles.subtitle}>
        {mode === 'transfer' ? 'Select where the money is coming from and going to.' : 'Select which account receives the deposit.'}
      </Text>

      {mode === 'transfer' ? (
        <>
          <Text style={styles.fieldLabel}>From</Text>
          <View style={styles.accountList}>
            {accounts.map((account) => (
              <SelectableAccountRow
                key={account.id}
                account={account}
                isSelected={fromAccountId === account.id}
                onPress={() => setFromAccountId(account.id)}
                listLabel="From"
              />
            ))}
          </View>

          <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>To</Text>
          <View style={styles.accountList}>
            {accounts
              .filter((a) => a.id !== fromAccountId)
              .map((account) => (
                <SelectableAccountRow
                  key={account.id}
                  account={account}
                  isSelected={toAccountId === account.id}
                  onPress={() => setToAccountId(account.id)}
                  listLabel="To"
                />
              ))}
          </View>
        </>
      ) : (
        <View style={styles.accountList}>
          {accounts.map((account) => (
            <SelectableAccountRow
              key={account.id}
              account={account}
              isSelected={toAccountId === account.id}
              onPress={() => setToAccountId(account.id)}
              listLabel="Deposit into"
            />
          ))}
        </View>
      )}

      {stepError ? <Text style={styles.errorText}>{stepError}</Text> : null}
      <View style={styles.footer}>
        <AuthButton title="Continue" onPress={goToAmount} />
      </View>
    </>
  );

  const renderAmount = () => (
    <>
      <Text style={styles.title}>Enter amount</Text>
      <Text style={styles.subtitle}>
        {mode === 'transfer'
          ? `From ${fromAccount?.name} to ${toAccount?.name}`
          : `Depositing into ${toAccount?.name}`}
      </Text>

      <AuthTextField
        label="Amount (CAD)"
        placeholder="0.00"
        keyboardType="decimal-pad"
        value={amountText}
        onChangeText={setAmountText}
        error={stepError ?? undefined}
      />

      {mode === 'transfer' && fromAccount ? (
        <Text style={styles.balancePreview}>Available in {fromAccount.name}: ${fromAccount.balance.toFixed(2)}</Text>
      ) : null}

      <AuthTextField label="Note (optional)" placeholder="What's this for?" value={note} onChangeText={setNote} />

      <View style={styles.footer}>
        <AuthButton title="Review" onPress={goToConfirm} disabled={!amountText} />
      </View>
    </>
  );

  const renderConfirm = () => (
    <>
      <Text style={styles.title}>Review</Text>
      <Text style={styles.subtitle}>Double check the details before you continue.</Text>

      <View style={styles.summaryCard}>
        {mode === 'transfer' ? (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>From</Text>
              <Text style={styles.summaryValue}>{fromAccount?.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>To</Text>
              <Text style={styles.summaryValue}>{toAccount?.name}</Text>
            </View>
          </>
        ) : (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Depositing into</Text>
            <Text style={styles.summaryValue}>{toAccount?.name}</Text>
          </View>
        )}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Amount</Text>
          <Text style={styles.summaryAmount}>${numericAmount.toFixed(2)}</Text>
        </View>
        {note ? (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Note</Text>
            <Text style={styles.summaryValue}>{note}</Text>
          </View>
        ) : null}
      </View>

      {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

      <View style={styles.footer}>
        <AuthButton
          title={mode === 'transfer' ? 'Confirm transfer' : 'Confirm deposit'}
          onPress={handleSubmit}
          loading={isSubmitting}
        />
      </View>
    </>
  );

  const renderSuccess = () => {
    const isTransfer = mode === 'transfer' && transferResult;
    const displayAccount = isTransfer ? transferResult!.toAccount : depositResult?.account;

    return (
      <View style={styles.successWrapper}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={40} color={colors.background} />
        </View>
        <Text style={styles.successTitle}>
          {mode === 'transfer' ? 'Transfer complete' : 'Deposit complete'}
        </Text>
        <Text style={styles.successSubtitle}>
          ${numericAmount.toFixed(2)} {mode === 'transfer' ? `sent to ${toAccount?.name}` : `added to ${toAccount?.name}`}
        </Text>

        {displayAccount ? (
          <View style={styles.successBalanceCard}>
            <Text style={styles.successBalanceLabel}>New balance</Text>
            <Text style={styles.successBalanceValue}>${displayAccount.balance.toFixed(2)}</Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <AuthButton title="Done" onPress={() => router.replace('/(tabs)')} />
          {displayAccount ? (
            <Pressable
              style={styles.viewAccountButton}
              onPress={() => router.replace(`/account/${displayAccount.id}`)}
            >
              <Text style={styles.viewAccountButtonText}>View account transactions</Text>
            </Pressable>
          ) : null}
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
            onPress={() => {
              if (step === 'action') close();
              else if (step === 'accounts') setStep('action');
              else if (step === 'amount') setStep('accounts');
              else if (step === 'confirm') setStep('amount');
            }}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <Pressable onPress={close} hitSlop={12}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {isLoadingAccounts ? (
          <ActivityIndicator color={colors.accentGold} style={styles.center} />
        ) : loadError ? (
          <Text style={styles.errorText}>{loadError}</Text>
        ) : (
          <>
            {step === 'action' && renderAction()}
            {step === 'accounts' && renderAccounts()}
            {step === 'amount' && renderAmount()}
            {step === 'confirm' && renderConfirm()}
            {step === 'success' && renderSuccess()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
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
    fontFamily: typography.fontFamily,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    fontFamily: typography.fontFamily,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  actionCardPressed: {
    borderColor: colors.accentGold,
    backgroundColor: colors.accentGoldFaint,
  },
  actionCardText: {
    flex: 1,
  },
  actionCardTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fontFamily,
  },
  actionCardSubtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
    fontFamily: typography.fontFamily,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    fontFamily: typography.fontFamily,
  },
  fieldLabelSpaced: {
    marginTop: spacing.lg,
  },
  accountList: {
    gap: spacing.sm,
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
    fontFamily: typography.fontFamily,
  },
  accountRowType: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
    fontFamily: typography.fontFamily,
  },
  balancePreview: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    fontFamily: typography.fontFamily,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fontFamily,
  },
  summaryAmount: {
    color: colors.accentGold,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fontFamily,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.sizes.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    fontFamily: typography.fontFamily,
  },
  footer: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  successWrapper: {
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
    fontFamily: typography.fontFamily,
  },
  successSubtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontFamily: typography.fontFamily,
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
    fontFamily: typography.fontFamily,
  },
  successBalanceValue: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs,
    fontFamily: typography.fontFamily,
  },
  viewAccountButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  viewAccountButtonText: {
    color: colors.accentGold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fontFamily,
  },
});
