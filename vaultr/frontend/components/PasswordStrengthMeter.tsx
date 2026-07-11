import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';
import { evaluatePasswordStrength, type StrengthLabel } from '../services/passwordSecurity';

interface PasswordStrengthMeterProps {
  password: string;
  /** Extra context (name, email) so look-alike passwords score lower. */
  userInputs?: string[];
}

const COLOR_BY_LABEL: Record<StrengthLabel, string> = {
  Weak: colors.danger,
  Fair: '#d98a3d',
  Good: colors.accentGold,
  Strong: colors.positive,
};

// How many of the four segments light up per raw score.
const SEGMENTS_BY_SCORE: Record<number, number> = { 0: 1, 1: 1, 2: 2, 3: 3, 4: 4 };
const SEGMENT_COUNT = 4;

/**
 * Subtle four-segment strength bar with a label (Weak/Fair/Good/Strong) and a
 * single helpful hint. Renders nothing until the user starts typing.
 */
export default function PasswordStrengthMeter({ password, userInputs }: PasswordStrengthMeterProps) {
  const strength = useMemo(
    () => evaluatePasswordStrength(password, userInputs),
    [password, userInputs]
  );

  if (!password) return null;

  const filled = SEGMENTS_BY_SCORE[strength.score];
  const color = COLOR_BY_LABEL[strength.label];
  const hint = strength.warning ?? strength.suggestions[0];

  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
          <View
            key={i}
            style={[styles.segment, { backgroundColor: i < filled ? color : colors.border }]}
          />
        ))}
      </View>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color }]}>{strength.label}</Text>
        {hint ? (
          <Text style={styles.hint} numberOfLines={2}>
            {hint}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  bars: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: radius.pill,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fontFamily,
  },
  hint: {
    flex: 1,
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily,
  },
});
