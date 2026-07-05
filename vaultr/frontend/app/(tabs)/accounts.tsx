import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../constants/theme';
import AccountCard from '../../components/AccountCard';
import api from '../../services/api';
import { friendlyError } from '../../services/errors';
import type { Account } from '../../types';

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<Account[]>('/accounts');
        setAccounts(data);
      } catch (err) {
        setError(friendlyError(err, "We couldn't load your accounts right now."));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Accounts</Text>
      {isLoading ? (
        <ActivityIndicator color={colors.accentGold} style={styles.center} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AccountCard account={item} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListHeaderComponent={
            accounts.length > 0 ? (
              <Text style={styles.summary}>Total across all accounts: ${totalBalance.toFixed(2)}</Text>
            ) : null
          }
          ListEmptyComponent={<Text style={styles.empty}>You don&apos;t have any accounts yet.</Text>}
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
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginVertical: spacing.lg,
  },
  summary: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.md,
  },
  center: {
    marginTop: spacing.xl,
  },
  error: {
    color: colors.danger,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
