import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { friendlyError } from '../../services/errors';
import { validateEmail, validatePassword } from '../../services/validation';
import AuthTextField from '../../components/AuthTextField';
import AuthButton from '../../components/AuthButton';
import AuthBackdrop from '../../components/AuthBackdrop';

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): FieldErrors => ({
    email: validateEmail(email),
    password: validatePassword(password),
  });

  const revalidateIfAttempted = (next: Partial<{ email: string; password: string }>) => {
    if (!hasAttemptedSubmit) return;
    setFieldErrors({
      email: validateEmail(next.email ?? email),
      password: validatePassword(next.password ?? password),
    });
  };

  const handleLogin = async () => {
    setAuthError(null);
    setHasAttemptedSubmit(true);

    const errors = validate();
    setFieldErrors(errors);
    if (errors.email || errors.password) return;

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setAuthError(friendlyError(err, 'Could not log you in. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AuthBackdrop />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>V</Text>
          </View>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Log in to manage your accounts</Text>

          <View style={styles.form}>
            <AuthTextField
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              value={email}
              editable={!isSubmitting}
              error={fieldErrors.email}
              onChangeText={(value) => {
                setEmail(value);
                revalidateIfAttempted({ email: value });
              }}
              onBlur={() => revalidateIfAttempted({})}
            />
            <AuthTextField
              label="Password"
              placeholder="Your password"
              secureTextEntry
              textContentType="password"
              value={password}
              editable={!isSubmitting}
              error={fieldErrors.password}
              onChangeText={(value) => {
                setPassword(value);
                revalidateIfAttempted({ password: value });
              }}
              onBlur={() => revalidateIfAttempted({})}
              onSubmitEditing={handleLogin}
              returnKeyType="go"
            />

            {authError ? (
              <View style={styles.authErrorBanner} accessibilityRole="alert">
                <Text style={styles.authErrorText}>{authError}</Text>
              </View>
            ) : null}

            <View style={styles.submitSpacing}>
              <AuthButton title="Log in" onPress={handleLogin} loading={isSubmitting} />
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Don&apos;t have an account? </Text>
            <Pressable onPress={() => router.push('/(auth)/signup')} disabled={isSubmitting} hitSlop={8}>
              <Text style={styles.switchLink}>Sign up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
    ...Platform.select({
      web: { boxShadow: '0px 20px 60px rgba(0, 0, 0, 0.45)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
        elevation: 6,
      },
    }),
  },
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: radius.button,
    backgroundColor: colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  brandMarkText: {
    color: colors.background,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
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
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },
  form: {
    width: '100%',
  },
  authErrorBanner: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.button,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  authErrorText: {
    color: colors.danger,
    fontSize: typography.sizes.sm,
  },
  submitSpacing: {
    marginTop: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.xxl,
  },
  switchText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
  switchLink: {
    color: colors.accentGold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
