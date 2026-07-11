import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import api from '../../services/api';
import { friendlyError } from '../../services/errors';
import { mockBills } from '../../constants/mockBills';
import BrandMark from '../../components/BrandMark';
import AccountCard from '../../components/AccountCard';
import GoalCard from '../../components/GoalCard';
import TransactionRow from '../../components/TransactionRow';
import QuickActionButton from '../../components/QuickActionButton';
import SectionHeader from '../../components/SectionHeader';
import InsightsCard from '../../components/InsightsCard';
import BillsCard from '../../components/BillsCard';
import SecurityCard from '../../components/SecurityCard';
import BalanceHistoryChart from '../../components/BalanceHistoryChart';
import VerifyEmailBanner from '../../components/VerifyEmailBanner';
import { generateBalanceHistory } from '../../constants/mockBalanceHistory';
import type { Account, Goal } from '../../types';

const RECENT_TRANSACTION_COUNT = 5;
const RECENT_ACTIVITY_WINDOW_HOURS = 48;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function isWithinHours(iso: string, hours: number): boolean {
  const diffMs = Date.now() - new Date(iso).getTime();
  return diffMs >= 0 && diffMs <= hours * 60 * 60 * 1000;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { transactions, isLoading: isLoadingTransactions, refetch: refetchTransactions } = useTransactions();

  const load = useCallback(async () => {
    try {
      const [accountsRes, goalsRes] = await Promise.all([
        api.get<Account[]>('/accounts'),
        api.get<Goal[]>('/goals'),
      ]);
      setAccounts(accountsRes.data);
      setGoals(goalsRes.data);
    } catch (err) {
      setError(friendlyError(err, "We couldn't load your dashboard right now."));
    } finally {
      setIsLoadingAccounts(false);
    }
  }, []);

  // Refetch every time Home regains focus — e.g. returning from a
  // successful transfer or deposit — so balances update instantly rather
  // than only on first mount.
  useFocusEffect(
    useCallback(() => {
      load();
      refetchTransactions();
    }, [load, refetchTransactions])
  );

  const totalBalance = useMemo(() => accounts.reduce((sum, a) => sum + a.balance, 0), [accounts]);
  const goalsValue = useMemo(() => goals.reduce((sum, g) => sum + g.currentAmount, 0), [goals]);
  const netWorth = totalBalance + goalsValue;

  // Overall balance history for the trend chart. Ends at the live total balance;
  // a fixed seed keeps the month-to-month shape stable across refreshes.
  const balanceHistory = useMemo(
    () => (accounts.length > 0 ? generateBalanceHistory(totalBalance, 6, 424242) : []),
    [accounts.length, totalBalance]
  );

  const todayActivity = useMemo(() => {
    const today = transactions.filter((t) => isWithinHours(t.createdAt, 24));
    const spent = today.filter((t) => t.type === 'DEBIT').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { count: today.length, spent };
  }, [transactions]);

  const recentTransactions = transactions.slice(0, RECENT_TRANSACTION_COUNT);
  const topGoals = goals.slice(0, 3);

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const isLoading = isLoadingAccounts || isLoadingTransactions;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {getGreeting()}, {firstName}
            </Text>
            <Text style={styles.date}>{getFormattedDate()}</Text>
          </View>
          <BrandMark size={40} />
        </View>

        <VerifyEmailBanner />

        {isLoading ? (
          <ActivityIndicator color={colors.accentGold} style={styles.loadingSpinner} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <>
            <View style={styles.balanceSection}>
              <Text style={styles.balanceLabel}>Total balance</Text>
              <Text style={styles.balanceValue}>${totalBalance.toFixed(2)}</Text>
              <Text style={styles.netWorth}>Net worth (incl. goals): ${netWorth.toFixed(2)}</Text>
              <Text style={styles.todayActivity}>
                {todayActivity.count === 0
                  ? 'No activity today'
                  : `${todayActivity.count} transaction${todayActivity.count === 1 ? '' : 's'} today · $${todayActivity.spent.toFixed(2)} spent`}
              </Text>
            </View>

            <View style={styles.quickActions}>
              <QuickActionButton
                label="Send"
                icon="arrow-up-circle-outline"
                onPress={() => router.push({ pathname: '/transfer', params: { mode: 'transfer' } })}
              />
              <QuickActionButton
                label="Add"
                icon="add-circle-outline"
                onPress={() => router.push({ pathname: '/transfer', params: { mode: 'deposit' } })}
              />
              <QuickActionButton
                label="Move"
                icon="swap-horizontal-outline"
                onPress={() => router.push({ pathname: '/transfer', params: { mode: 'transfer' } })}
              />
            </View>

            <View style={styles.section}>
              <BalanceHistoryChart data={balanceHistory} title="Total balance trend" />
            </View>

            <View style={styles.section}>
              <SectionHeader
                title="Accounts"
                actionLabel="See all"
                onActionPress={() => router.push('/(tabs)/accounts')}
              />
              {accounts.length === 0 ? (
                <Text style={styles.empty}>You don&apos;t have any accounts yet.</Text>
              ) : (
                <View style={styles.accountsList}>
                  {accounts.map((account) => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      onPress={(acc) => router.push(`/account/${acc.id}`)}
                      hasRecentActivity={transactions.some(
                        (t) => t.accountId === account.id && isWithinHours(t.createdAt, RECENT_ACTIVITY_WINDOW_HOURS)
                      )}
                    />
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <SectionHeader
                title="Recent transactions"
                actionLabel="See all"
                onActionPress={() => router.push('/(tabs)/payments')}
              />
              {recentTransactions.length === 0 ? (
                <Text style={styles.empty}>No transactions yet.</Text>
              ) : (
                <View style={styles.listCard}>
                  {recentTransactions.map((transaction) => (
                    <TransactionRow key={transaction.id} transaction={transaction} />
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <SectionHeader title="Spending insights" />
              <InsightsCard transactions={transactions} />
            </View>

            <View style={styles.section}>
              <SectionHeader title="Bills & upcoming payments" />
              <BillsCard bills={mockBills} />
            </View>

            <View style={styles.section}>
              <SectionHeader title="Security" />
              <SecurityCard />
            </View>

            <View style={styles.section}>
              <SectionHeader
                title="Financial goals"
                actionLabel="See all"
                onActionPress={() => router.push('/(tabs)/investments')}
              />
              {topGoals.length === 0 ? (
                <Text style={styles.empty}>No goals yet.</Text>
              ) : (
                <View style={styles.goalsList}>
                  {topGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                </View>
              )}
            </View>
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
  greeting: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  date: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  loadingSpinner: {
    marginTop: spacing.xxxl,
  },
  error: {
    color: colors.danger,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginTop: spacing.xxxl,
  },
  balanceSection: {
    marginTop: spacing.xxl,
  },
  balanceLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  balanceValue: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs,
  },
  netWorth: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginTop: spacing.sm,
  },
  todayActivity: {
    color: colors.accentGold,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  section: {
    marginTop: spacing.xxl,
  },
  accountsList: {
    gap: spacing.md,
  },
  goalsList: {
    gap: spacing.md,
  },
  listCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
  },
  empty: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
});
