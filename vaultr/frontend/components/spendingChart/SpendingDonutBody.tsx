import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PolarChart, Pie } from 'victory-native';
import { colors, typography } from '../../constants/theme';
import { DONUT_SIZE, DONUT_STROKE_WIDTH } from './constants';
import type { SpendingSlice } from '../../utils/spendingBreakdown';

/**
 * Native donut body: Victory Native's Pie chart (Skia-based). Web renders
 * `SpendingDonutBody.web.tsx` instead — the balance-history chart earlier in
 * this project already showed Skia's web canvas isn't wired up here, so the
 * native/web split established there is reused for this chart too.
 */
export default function SpendingDonutBody({
  slices,
  totalSpent,
}: {
  slices: SpendingSlice[];
  totalSpent: number;
}) {
  return (
    <View style={styles.wrapper}>
      <PolarChart data={slices} labelKey="category" valueKey="total" colorKey="color">
        <Pie.Chart innerRadius={DONUT_SIZE / 2 - DONUT_STROKE_WIDTH}>
          {({ slice }) => <Pie.Slice animate={{ type: 'timing', duration: 600 }} />}
        </Pie.Chart>
      </PolarChart>
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.centerLabel}>Total spent</Text>
        <Text style={styles.centerValue}>${totalSpent.toFixed(0)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: DONUT_SIZE,
    height: DONUT_SIZE,
    alignSelf: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily,
  },
  centerValue: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fontFamily,
    marginTop: 2,
  },
});
