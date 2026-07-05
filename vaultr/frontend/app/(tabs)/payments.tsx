import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../constants/theme';
import TransactionRow from '../../components/TransactionRow';
import SearchBar from '../../components/SearchBar';
import AccountFilterChips from '../../components/AccountFilterChips';
import { useTransactions } from '../../hooks/useTransactions';
import api from '../../services/api';
import { friendlyError } from '../../services/errors';
import type { Account } from '../../types';

function matchesSearch(transaction: { merchantName: string; title?: string; description?: string | null; category: string; amount: number }, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const haystack = [
    transaction.title ?? transaction.merchantName,
    transaction.merchantName,
    transaction.description ?? '',
    transaction.category,
    transaction.amount.toFixed(2),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(needle);
}

export default function PaymentsScreen() {
  const { transactions, isLoading: isLoadingTransactions, error: transactionsError } = useTransactions();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<Account[]>('/accounts');
        setAccounts(data);
      } catch (err) {
        setAccountsError(friendlyError(err, "We couldn't load your accounts right now."));
      } finally {
        setIsLoadingAccounts(false);
      }
    })();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => (selectedAccountId ? t.accountId === selectedAccountId : true))
      .filter((t) => matchesSearch(t, searchQuery));
  }, [transactions, selectedAccountId, searchQuery]);

  const isLoading = isLoadingTransactions || isLoadingAccounts;
  const error = transactionsError ?? accountsError;
  const hasAnyTransactions = transactions.length > 0;
  const isFiltering = searchQuery.trim().length > 0 || selectedAccountId !== null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Payments</Text>

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

      {accounts.length > 0 ? (
        <View style={styles.filterRow}>
          <AccountFilterChips
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            onSelect={setSelectedAccountId}
          />
        </View>
      ) : null}

      {isLoading ? (
        <ActivityIndicator color={colors.accentGold} style={styles.center} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={filteredTransactions.length > 0 ? styles.listCard : undefined}
          renderItem={({ item }) => <TransactionRow transaction={item} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name={isFiltering ? 'search-outline' : 'receipt-outline'}
                size={28}
                color={colors.textMuted}
              />
              <Text style={styles.emptyTitle}>
                {!hasAnyTransactions
                  ? 'No transactions yet'
                  : isFiltering
                    ? 'No matching transactions'
                    : 'No transactions yet'}
              </Text>
              {isFiltering && hasAnyTransactions ? (
                <Text style={styles.emptySubtitle}>Try a different search term or account filter.</Text>
              ) : null}
            </View>
          }
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
  title: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginVertical: spacing.lg,
  },
  filterRow: {
    marginTop: spacing.md,
  },
  center: {
    marginTop: spacing.xl,
  },
  error: {
    color: colors.danger,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  list: {
    marginTop: spacing.md,
  },
  listCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
});
