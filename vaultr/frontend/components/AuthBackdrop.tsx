import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../constants/theme';

/**
 * Subtle decorative shading for auth screens — two soft, low-opacity gold
 * circles layered behind the form. Flat colors only (no gradients), reads as
 * a faint glow against the near-black background rather than visible shapes.
 */
export default function AuthBackdrop() {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={[styles.circle, styles.circleTop]} />
      <View style={[styles.circle, styles.circleBottom]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: colors.accentGoldFaint,
  },
  circleTop: {
    width: 420,
    height: 420,
    top: -160,
    right: -140,
  },
  circleBottom: {
    width: 320,
    height: 320,
    bottom: -120,
    left: -120,
  },
});
