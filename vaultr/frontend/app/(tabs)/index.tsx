import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';
import BalanceHeader from '../../components/BalanceHeader';
import AccountCard from '../../components/AccountCard';
import api from '../../services/api';
import { friendlyError } from '../../services/errors';
import type { Account } from '../../types';

export default function HomeScreen() {
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
    <View style={styles.container}>
      <BalanceHeader totalBalance={totalBalance} />
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
          ListEmptyComponent={<Text style={styles.empty}>You don&apos;t have any accounts yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
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
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
