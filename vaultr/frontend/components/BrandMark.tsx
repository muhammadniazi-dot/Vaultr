import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius } from '../constants/theme';

interface BrandMarkProps {
  size?: number;
}

/**
 * The Vaultr mark — a literal vault/safe glyph, used consistently on the
 * dashboard header and the auth screens so both feel like the same app.
 */
export default function BrandMark({ size = 48 }: BrandMarkProps) {
  return (
    <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.32 }]}>
      <MaterialCommunityIcons name="safe-square-outline" size={size * 0.56} color={colors.background} />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    backgroundColor: colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.button,
  },
});
