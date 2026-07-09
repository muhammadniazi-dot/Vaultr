import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Area, CartesianChart, Line } from 'victory-native';
import { Circle, LinearGradient, useFont, vec } from '@shopify/react-native-skia';
import { colors, spacing } from '../../constants/theme';
import { CHART_HEIGHT, formatCompact } from './constants';
import type { BalancePoint } from '../../constants/mockBalanceHistory';

// Subtle vertical fade under the line — gold near the curve, transparent at the
// baseline. Kept low-opacity so it reads as depth, not a loud gradient.
const AREA_FADE_TOP = 'rgba(201, 168, 76, 0.22)';
const AREA_FADE_BOTTOM = 'rgba(201, 168, 76, 0)';

type ChartPoint = { x: number; y: number | null | undefined };

/** Gold dot (with a soft halo) marking the most recent balance. */
function LatestPointMarker({ points }: { points: readonly ChartPoint[] }) {
  const last = points[points.length - 1];
  if (!last || last.y == null) return null;
  return (
    <>
      <Circle cx={last.x} cy={last.y} r={7} color={colors.accentGoldSoft} />
      <Circle cx={last.x} cy={last.y} r={4} color={colors.accentGold} />
    </>
  );
}

/**
 * Native plotting body: an animated Victory Native (Skia) line chart with a
 * smooth gold curve, subtle gold area fade, muted axes, and a highlighted
 * latest point. Rendered only when there are >= 2 points (guaranteed by the
 * parent). See `BalanceChartBody.web.tsx` for the web fallback.
 */
export default function BalanceChartBody({ data }: { data: BalancePoint[] }) {
  const font = useFont(require('../../assets/fonts/Satoshi-Variable.ttf'), 11);
  const tickValues = data.map((d) => d.index);

  return (
    <View style={styles.chartWrapper}>
      <CartesianChart
        data={data}
        xKey="index"
        yKeys={['balance']}
        domainPadding={{ top: 28, bottom: 16, left: 12, right: 16 }}
        xAxis={{
          font,
          tickValues,
          lineColor: 'transparent',
          labelColor: colors.textMuted,
          formatXLabel: (index) => data[index]?.label ?? '',
        }}
        yAxis={[
          {
            font,
            tickCount: 4,
            lineColor: colors.border,
            labelColor: colors.textMuted,
            formatYLabel: (value) => formatCompact(value),
          },
        ]}
      >
        {({ points, chartBounds }) => (
          <>
            <Area
              points={points.balance}
              y0={chartBounds.bottom}
              curveType="natural"
              animate={{ type: 'timing', duration: 900 }}
            >
              <LinearGradient
                start={vec(0, chartBounds.top)}
                end={vec(0, chartBounds.bottom)}
                colors={[AREA_FADE_TOP, AREA_FADE_BOTTOM]}
              />
            </Area>
            <Line
              points={points.balance}
              color={colors.accentGold}
              strokeWidth={3}
              curveType="natural"
              strokeCap="round"
              strokeJoin="round"
              animate={{ type: 'timing', duration: 900 }}
            />
            <LatestPointMarker points={points.balance} />
          </>
        )}
      </CartesianChart>
    </View>
  );
}

const styles = StyleSheet.create({
  chartWrapper: {
    height: CHART_HEIGHT,
    marginTop: spacing.lg,
  },
});
