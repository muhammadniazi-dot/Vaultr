import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';

/**
 * Soft nudge shown while the signed-in user's email is unverified. Renders
 * nothing once verified (or when the flag is unknown, e.g. an older cached
 * session), so it only ever nags accounts we know are unverified.
 */
export default function VerifyEmailBanner() {
  const { user } = useAuth();
  if (!user || user.emailVerified !== false) return null;

  return (
    <Pressable
      style={styles.banner}
      onPress={() => router.push('/verify-email')}
      accessibilityRole="button"
      accessibilityLabel="Verify your email"
    >
      <Ionicons name="mail-unread-outline" size={20} color={colors.accentGold} />
      <View style={styles.text}>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          Confirm {user.email} to secure your account.
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.accentGoldFaint,
    borderColor: colors.accentGoldSoft,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  text: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
});
