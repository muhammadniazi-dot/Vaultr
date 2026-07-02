import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import BalanceHeader from '../../components/BalanceHeader';
import AccountCard from '../../components/AccountCard';
import api from '../../services/api';
import type { Account } from '../../types';

export default function HomeScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<Account[]>('/accounts');
        setAccounts(data);
      } catch {
        setAccounts([]);
      }
    })();
  }, []);

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <View style={styles.container}>
      <BalanceHeader totalBalance={totalBalance} />
      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AccountCard account={item} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
});
