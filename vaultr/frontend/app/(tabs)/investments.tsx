import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { friendlyError } from '../../services/errors';
import api from '../../services/api';
import GoalCard from '../../components/GoalCard';
import AuthButton from '../../components/AuthButton';
import type { Account, Goal } from '../../types';

export default function InvestmentsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [goalsRes, accountsRes] = await Promise.all([
        api.get<Goal[]>('/goals'),
        api.get<Account[]>('/accounts'),
      ]);
      setGoals(goalsRes.data);
      setAccounts(accountsRes.data);
    } catch (err) {
      setError(friendlyError(err, "We couldn't load your goals right now."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refetch on focus so a newly created goal (or an updated balance that
  // shifts progress) shows up immediately when returning to this screen.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Goals & Investments</Text>
        <Pressable
          onPress={() => router.push('/create-goal')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Create goal"
          style={styles.addButton}
        >
          <Ionicons name="add" size={22} color={colors.background} />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accentGold} style={styles.center} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={goals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={goals.length === 0 ? styles.emptyContent : undefined}
          renderItem={({ item }) => <GoalCard goal={item} accounts={accounts} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrapper}>
                <Ionicons name="flag-outline" size={28} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No goals yet</Text>
              <Text style={styles.emptySubtitle}>
                Set a savings target and link it to an account to start tracking progress.
              </Text>
              <View style={styles.emptyButton}>
                <AuthButton title="Create goal" onPress={() => router.push('/create-goal')} />
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
  center: {
    marginTop: spacing.xxxl,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginTop: spacing.xxxl,
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
