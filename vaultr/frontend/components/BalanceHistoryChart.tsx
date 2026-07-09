import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../constants/theme';
import { CHART_HEIGHT } from './balanceChart/constants';
import BalanceChartBody from './balanceChart/BalanceChartBody';
import type { BalancePoint } from '../constants/mockBalanceHistory';

interface BalanceHistoryChartProps {
  data: BalancePoint[];
  /** Card heading, e.g. 'Balance trend'. */
  title?: string;
  isLoading?: boolean;
  error?: string | null;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Card wrapper for the balance-over-time chart: heading, summary (current
 * balance + monthly change $/%), and the plotted trend.
 *
 * The actual plotting lives in a platform-split `BalanceChartBody` — native
 * renders the animated Victory Native (Skia) line chart; web renders a
 * lightweight non-Skia fallback, since Skia's canvas needs CanvasKit/WASM that
 * isn't wired up for the web build. This file stays Skia-free so it's safe on
 * every platform.
 */
export default function BalanceHistoryChart({
  data,
  title = 'Balance trend',
  isLoading = false,
  error = null,
}: BalanceHistoryChartProps) {
  const summary = useMemo(() => {
    if (data.length === 0) return null;
    const current = data[data.length - 1].balance;
    const previous = data.length >= 2 ? data[data.length - 2].balance : null;
    const change = previous == null ? null : current - previous;
    const pct = previous && previous !== 0 && change != null ? (change / previous) * 100 : null;
    return { current, change, pct, isGain: (change ?? 0) >= 0 };
  }, [data]);

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.accentGold} />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>{error}</Text>
        </View>
      );
    }
    if (data.length === 0) {
      return (
        <View style={styles.stateBox}>
          <Ionicons name="analytics-outline" size={26} color={colors.textMuted} />
          <Text style={styles.stateText}>No balance history yet.</Text>
        </View>
      );
    }
    // A single point can't form a line — show a calm note instead of an empty
    // or crashing chart. The summary above still shows the current balance.
    if (data.length === 1) {
      return (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>Not enough history to chart yet.</Text>
        </View>
      );
    }
    return <BalanceChartBody data={data} />;
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      {summary ? (
        <>
          <Text style={styles.balance}>{formatCurrency(summary.current)}</Text>
          {summary.change != null ? (
            <View style={styles.changeRow}>
              <Ionicons
                name={summary.isGain ? 'caret-up' : 'caret-down'}
                size={13}
                color={summary.isGain ? colors.positive : colors.danger}
              />
              <Text
                style={[
                  styles.changeText,
                  { color: summary.isGain ? colors.positive : colors.danger },
                ]}
              >
                {formatCurrency(Math.abs(summary.change))}
                {summary.pct != null ? ` (${Math.abs(summary.pct).toFixed(1)}%)` : ''}
              </Text>
              <Text style={styles.changeCaption}>vs last month</Text>
            </View>
          ) : null}
        </>
      ) : null}

      {renderBody()}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  title: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: typography.fontFamily,
  },
  balance: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs,
    fontFamily: typography.fontFamily,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  changeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fontFamily,
  },
  changeCaption: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginLeft: spacing.xs,
    fontFamily: typography.fontFamily,
  },
  stateBox: {
    height: CHART_HEIGHT,
    marginTop: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  stateText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily,
  },
});
