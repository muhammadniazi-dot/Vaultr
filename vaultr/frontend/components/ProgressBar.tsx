import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../constants/theme';

interface ProgressBarProps {
  progress: number; // 0-1
  color?: string;
  height?: number;
}

export default function ProgressBar({ progress, color = colors.accentGold, height = 6 }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(progress, 1));

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color, borderRadius: height / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.surface,
    overflow: 'hidden',
    borderRadius: radius.button,
  },
  fill: {
    height: '100%',
  },
});
