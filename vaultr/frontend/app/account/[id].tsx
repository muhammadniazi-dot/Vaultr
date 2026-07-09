import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import TransactionRow from '../../components/TransactionRow';
import BalanceHistoryChart from '../../components/BalanceHistoryChart';
import api from '../../services/api';
import { friendlyError } from '../../services/errors';
import { generateBalanceHistory, seedFromString } from '../../constants/mockBalanceHistory';
import type { Account, AccountType, Transaction } from '../../types';

const LABELS_BY_TYPE: Record<AccountType, string> = {
  SAVINGS: 'Savings',
  CHEQUING: 'Chequing',
  TFSA: 'TFSA',
};

function AccountIcon({ type }: { type: AccountType }) {
  const size = 24;
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

export default function AccountDetailScreen() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [accountRes, transactionsRes] = await Promise.all([
        api.get<Account>(`/accounts/${id}`),
        api.get<Transaction[]>('/transactions', { params: { accountId: id } }),
      ]);
      setAccount(accountRes.data);
      setTransactions(transactionsRes.data);
    } catch (err) {
      setError(friendlyError(err, "We couldn't load this account right now."));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Refetch every time this screen regains focus, so balances/transactions
  // update instantly after returning from a successful transfer or deposit.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Per-account balance history for the trend chart. Seeded off the account id
  // so each account has its own stable shape, ending at its live balance.
  const balanceHistory = useMemo(
    () => (account ? generateBalanceHistory(account.balance, 6, seedFromString(account.id)) : []),
    [account]
  );

  if (isAuthLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>Account details</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accentGold} style={styles.center} />
      ) : error || !account ? (
        <Text style={styles.error}>{error ?? 'Account not found.'}</Text>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={transactions.length > 0 ? styles.listCard : undefined}
          renderItem={({ item }) => <TransactionRow transaction={item} />}
          ListHeaderComponent={
            <>
              <View style={styles.accountHeader}>
                <View style={styles.iconWrapper}>
                  <AccountIcon type={account.type} />
                </View>
                <Text style={styles.accountType}>{LABELS_BY_TYPE[account.type]}</Text>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={styles.balance}>${account.balance.toFixed(2)}</Text>
                <Text style={styles.accountNumber}>•••• {lastFourFromId(account.id)}</Text>

                <Pressable
                  style={({ pressed }) => [styles.transferButton, pressed && styles.transferButtonPressed]}
                  onPress={() =>
                    router.push({ pathname: '/transfer', params: { mode: 'transfer', fromAccountId: account.id } })
                  }
                >
                  <Ionicons name="swap-horizontal-outline" size={18} color={colors.accentGold} />
                  <Text style={styles.transferButtonText}>Send from this account</Text>
                </Pressable>
              </View>

              <View style={styles.chartSection}>
                <BalanceHistoryChart data={balanceHistory} title="Balance trend" />
              </View>

              <Text style={styles.sectionTitle}>Transactions</Text>
            </>
          }
          ListEmptyComponent={<Text style={styles.empty}>No transactions for this account yet.</Text>}
        />
      )}
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
  center: {
    marginTop: spacing.xxxl,
  },
  error: {
    color: colors.danger,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginTop: spacing.xxxl,
  },
  list: {
    flex: 1,
  },
  listCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  accountHeader: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: radius.button,
    backgroundColor: colors.accentGoldFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  accountType: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accountName: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.xs,
  },
  balance: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.md,
  },
  accountNumber: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
    letterSpacing: 1,
  },
  transferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.lg,
  },
  transferButtonPressed: {
    borderColor: colors.accentGold,
    backgroundColor: colors.accentGoldFaint,
  },
  transferButtonText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  chartSection: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  empty: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
