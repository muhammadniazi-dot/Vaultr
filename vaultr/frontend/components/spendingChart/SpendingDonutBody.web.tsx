import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography } from '../../constants/theme';
import { DONUT_SIZE, DONUT_STROKE_WIDTH } from './constants';
import type { SpendingSlice } from '../../utils/spendingBreakdown';

/**
 * Web fallback: a multi-segment ring built from stacked SVG circles
 * (strokeDasharray/strokeDashoffset per slice), the same technique used by
 * CircularProgressRing. Skia (what the native Pie chart draws through) isn't
 * wired up for this project's web build — see SpendingDonutBody.tsx.
 */
export default function SpendingDonutBody({
  slices,
  totalSpent,
}: {
  slices: SpendingSlice[];
  totalSpent: number;
}) {
  const radius = (DONUT_SIZE - DONUT_STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;

  return (
    <View style={styles.wrapper}>
      <Svg width={DONUT_SIZE} height={DONUT_SIZE} style={styles.svg}>
        {slices.map((slice) => {
          const length = (slice.percent / 100) * circumference;
          const offset = -cumulative;
          cumulative += length;
          return (
            <Circle
              key={slice.category}
              cx={DONUT_SIZE / 2}
              cy={DONUT_SIZE / 2}
              r={radius}
              stroke={slice.color}
              strokeWidth={DONUT_STROKE_WIDTH}
              fill="none"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={offset}
            />
          );
        })}
      </Svg>
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
  svg: {
    transform: [{ rotate: '-90deg' }],
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
