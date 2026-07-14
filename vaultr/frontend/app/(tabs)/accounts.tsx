import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../constants/theme';
import AccountCard from '../../components/AccountCard';
import AuthButton from '../../components/AuthButton';
import api from '../../services/api';
import { friendlyError } from '../../services/errors';
import type { Account } from '../../types';

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<Account[]>('/accounts');
      setAccounts(data);
    } catch (err) {
      setError(friendlyError(err, "We couldn't load your accounts right now."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refetch on focus so balances are current after returning from a
  // successful transfer/deposit, and so a newly opened account shows up
  // immediately.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Accounts</Text>
        <Pressable
          onPress={() => router.push('/open-account')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open an account"
          style={styles.addButton}
        >
          <Ionicons name="add" size={22} color={colors.background} />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accentGold} style={styles.center} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={accounts.length === 0 ? styles.emptyContent : undefined}
          renderItem={({ item }) => (
            <AccountCard account={item} onPress={(acc) => router.push(`/account/${acc.id}`)} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListHeaderComponent={
            accounts.length > 0 ? (
              <Text style={styles.summary}>Total across all accounts: ${totalBalance.toFixed(2)}</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrapper}>
                <Ionicons name="wallet-outline" size={28} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>You don&apos;t have any accounts yet</Text>
              <Text style={styles.emptySubtitle}>
                Open your first Vaultr account to start banking.
              </Text>
              <View style={styles.emptyButton}>
                <AuthButton title="Open an account" onPress={() => router.push('/open-account')} />
              </View>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: radius.button,
    backgroundColor: colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyContent: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: radius.card,
    backgroundColor: colors.accentGoldFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    width: '100%',
    maxWidth: 280,
  },
});
