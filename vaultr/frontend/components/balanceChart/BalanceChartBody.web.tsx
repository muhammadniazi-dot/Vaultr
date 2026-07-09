import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { CHART_HEIGHT, formatCompact } from './constants';
import type { BalancePoint } from '../../constants/mockBalanceHistory';

const LABEL_ROW_HEIGHT = 18;
const MAX_BAR_HEIGHT = CHART_HEIGHT - LABEL_ROW_HEIGHT - spacing.lg;

/**
 * Web fallback body for the balance-history chart.
 *
 * Victory Native draws through Skia, whose canvas needs CanvasKit/WASM that
 * isn't wired up for this app's web build (it throws on `CartesianChart`). The
 * mobile app — the actual target — renders the full animated Victory Native
 * line chart (see `BalanceChartBody.tsx`). On web we render a clean, on-theme
 * gold bar sparkline so the dashboard still communicates the trend and the web
 * build never crashes.
 */
export default function BalanceChartBody({ data }: { data: BalancePoint[] }) {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  const balances = data.map((d) => d.balance);
  const min = Math.min(...balances);
  const max = Math.max(...balances);
  const range = max - min || 1;

  return (
    <Animated.View style={[styles.wrapper, { opacity: fade }]}>
      <View style={styles.bars}>
        {data.map((point, index) => {
          // Floor the shortest bar at 15% so every month stays visible.
          const fraction = 0.15 + 0.85 * ((point.balance - min) / range);
          const isLast = index === data.length - 1;
          return (
            <View key={point.monthKey} style={styles.barColumn}>
              <View
                style={[
                  styles.bar,
                  { height: Math.round(fraction * MAX_BAR_HEIGHT) },
                  isLast ? styles.barLatest : styles.barMuted,
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.labels}>
        {data.map((point) => (
          <Text key={point.monthKey} style={styles.label} numberOfLines={1}>
            {point.label}
          </Text>
        ))}
      </View>
      <View style={styles.rangeRow}>
        <Text style={styles.rangeText}>Low {formatCompact(min)}</Text>
        <Text style={styles.rangeText}>High {formatCompact(max)}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.lg,
  },
  bars: {
    height: MAX_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '70%',
    borderTopLeftRadius: radius.button,
    borderTopRightRadius: radius.button,
  },
  barMuted: {
    backgroundColor: colors.accentGoldSoft,
  },
  barLatest: {
    backgroundColor: colors.accentGold,
  },
  labels: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  rangeText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily,
  },
});
