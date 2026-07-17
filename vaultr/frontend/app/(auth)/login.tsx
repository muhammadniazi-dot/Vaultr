import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { friendlyError } from '../../services/errors';
import { validateEmail, validatePassword } from '../../services/validation';
import AuthTextField from '../../components/AuthTextField';
import AuthButton from '../../components/AuthButton';
import AuthBackdrop from '../../components/AuthBackdrop';
import AuthHeader from '../../components/AuthHeader';
import BiometricLoginButton from '../../components/BiometricLoginButton';

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
  const [isBiometricBusy, setIsBiometricBusy] = useState(false);
  const isBusy = isSubmitting || isBiometricBusy;

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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? spacing.xl : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <AuthHeader title="Welcome back" subtitle="Sign in to securely manage your accounts and payments." />

            <View style={styles.form}>
              <AuthTextField
                label="Email address"
                placeholder="you@example.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                value={email}
                editable={!isBusy}
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
                showToggle
                textContentType="password"
                value={password}
                editable={!isBusy}
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
                <AuthButton
                  title="Log in"
                  onPress={handleLogin}
                  loading={isSubmitting}
                  disabled={isBiometricBusy}
                  icon={<Ionicons name="log-in-outline" size={18} color={colors.background} />}
                />
              </View>

              <BiometricLoginButton onError={setAuthError} onBusyChange={setIsBiometricBusy} />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.switchText}>Don&apos;t have an account? </Text>
          <Pressable onPress={() => router.push('/(auth)/signup')} disabled={isBusy} hitSlop={8}>
            <Text style={styles.switchLink}>Sign up</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  form: {
    width: '100%',
    marginTop: spacing.xl,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
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
