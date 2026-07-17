import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../constants/theme';
import BrandMark from './BrandMark';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

/**
 * Shared header for the auth screens: the Vaultr mark inside a softly-glowing
 * circular "orb", a large centered title, and a muted supporting subtitle.
 * Keeps login and signup visually identical up top.
 */
export default function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.halo}>
        <BrandMark size={92} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  halo: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    // Dark backing so the logo's own black circle sits seamlessly, framed by a
    // hairline gold ring; a flat gold glow (no gradients) reads as a premium
    // brand medallion.
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.accentGoldSoft,
    marginBottom: spacing.xl,
    ...Platform.select({
      web: { boxShadow: '0px 8px 40px rgba(201, 168, 76, 0.20)' },
      default: {
        shadowColor: colors.accentGold,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 22,
        elevation: 6,
      },
    }),
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    fontFamily: typography.fontFamily,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    fontFamily: typography.fontFamily,
  },
});
