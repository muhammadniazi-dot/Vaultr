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
        <BrandMark size={56} />
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
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentGoldFaint,
    borderWidth: 1,
    borderColor: colors.accentGoldSoft,
    marginBottom: spacing.xl,
    // Flat gold glow (no gradients) to read as a premium brand orb.
    ...Platform.select({
      web: { boxShadow: '0px 8px 40px rgba(201, 168, 76, 0.18)' },
      default: {
        shadowColor: colors.accentGold,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
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
