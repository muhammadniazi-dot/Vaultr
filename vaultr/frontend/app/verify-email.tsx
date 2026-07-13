import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { friendlyError } from '../services/errors';
import {
  resendVerificationEmail,
  sendVerificationEmail,
  verifyEmail,
} from '../services/emailVerification';
import AuthTextField from '../components/AuthTextField';
import AuthButton from '../components/AuthButton';

const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyEmailScreen() {
  const { user, isLoading: isAuthLoading, refreshUser } = useAuth();
  // `sent=1` means signup already sent a code, so we skip the on-mount send.
  const params = useLocalSearchParams<{ sent?: string }>();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const didInitialSend = useRef(false);

  useEffect(() => {
    if (params.sent || didInitialSend.current) return;
    didInitialSend.current = true;
    // Arrived from somewhere other than signup (e.g. the "verify" banner) —
    // make sure a fresh code is waiting. Best-effort.
    sendVerificationEmail().catch(() => {});
  }, [params.sent]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    setError(null);
    setInfo(null);
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setIsSubmitting(true);
    try {
      const updated = await verifyEmail(code.trim());
      await refreshUser(updated);
      router.replace('/(tabs)');
    } catch (err) {
      setError(friendlyError(err, 'Could not verify your email. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(null);
    setInfo(null);
    try {
      await resendVerificationEmail();
      setInfo('We sent a new code to your email.');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(friendlyError(err, 'Could not resend the code. Please try again.'));
    }
  };

  if (isAuthLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.replace('/(tabs)')} hitSlop={12} accessibilityLabel="Close">
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? spacing.xl : 0}
      >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconWrapper}>
          <Ionicons name="mail-outline" size={32} color={colors.accentGold} />
        </View>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code we sent to{'\n'}
          <Text style={styles.email}>{user.email}</Text>
        </Text>

        <AuthTextField
          label="Verification code"
          placeholder="123456"
          keyboardType="number-pad"
          maxLength={6}
          textContentType="oneTimeCode"
          value={code}
          editable={!isSubmitting}
          error={error ?? undefined}
          onChangeText={(value) => setCode(value.replace(/[^0-9]/g, ''))}
          onSubmitEditing={handleVerify}
          returnKeyType="go"
        />

        {info ? <Text style={styles.info}>{info}</Text> : null}

        <View style={styles.submitSpacing}>
          <AuthButton title="Verify" onPress={handleVerify} loading={isSubmitting} />
        </View>

        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Didn&apos;t get it? </Text>
          <Pressable onPress={handleResend} disabled={cooldown > 0} hitSlop={8}>
            <Text style={[styles.resendLink, cooldown > 0 && styles.resendLinkDisabled]}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </Text>
          </Pressable>
        </View>

        <Pressable onPress={() => router.replace('/(tabs)')} hitSlop={8} style={styles.laterButton}>
          <Text style={styles.laterText}>I&apos;ll verify later</Text>
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: spacing.md,
  },
  keyboardAvoider: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: radius.card,
    backgroundColor: colors.accentGoldFaint,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
    lineHeight: 20,
  },
  email: {
    color: colors.textPrimary,
    fontWeight: typography.weights.semibold,
  },
  info: {
    color: colors.positive,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.sm,
  },
  submitSpacing: {
    marginTop: spacing.sm,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  resendText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
  resendLink: {
    color: colors.accentGold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  resendLinkDisabled: {
    color: colors.textMuted,
  },
  laterButton: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  laterText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
});
