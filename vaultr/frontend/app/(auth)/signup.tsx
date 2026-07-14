import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { friendlyError } from '../../services/errors';
import { getBiometricKind, type BiometricKind } from '../../services/auth';
import { validateEmail, validateName, validatePassword, validatePasswordMatch } from '../../services/validation';
import { evaluatePasswordStrength, isPasswordBreached } from '../../services/passwordSecurity';
import AuthTextField from '../../components/AuthTextField';
import AuthButton from '../../components/AuthButton';
import AuthBackdrop from '../../components/AuthBackdrop';
import BrandMark from '../../components/BrandMark';
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter';

const MIN_PASSWORD_LENGTH = 8;

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const PROMPT_COPY_BY_KIND: Record<Exclude<BiometricKind, 'none'>, { title: string; label: string }> = {
  face: { title: 'Enable Face ID?', label: 'Face ID' },
  fingerprint: { title: 'Enable Touch ID?', label: 'Touch ID' },
  generic: { title: 'Enable biometric login?', label: 'biometric login' },
};

export default function SignupScreen() {
  const { signup, enableBiometricLogin } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): FieldErrors => ({
    name: validateName(name),
    email: validateEmail(email),
    password: validatePassword(password, MIN_PASSWORD_LENGTH),
    confirmPassword: validatePasswordMatch(password, confirmPassword),
  });

  const revalidateIfAttempted = (
    next: Partial<{ name: string; email: string; password: string; confirmPassword: string }>
  ) => {
    if (!hasAttemptedSubmit) return;
    const nextPassword = next.password ?? password;
    const nextConfirmPassword = next.confirmPassword ?? confirmPassword;
    setFieldErrors({
      name: validateName(next.name ?? name),
      email: validateEmail(next.email ?? email),
      password: validatePassword(nextPassword, MIN_PASSWORD_LENGTH),
      confirmPassword: validatePasswordMatch(nextPassword, nextConfirmPassword),
    });
  };

  const handleSignup = async () => {
    setAuthError(null);
    setHasAttemptedSubmit(true);

    const errors = validate();
    setFieldErrors(errors);
    if (errors.name || errors.email || errors.password || errors.confirmPassword) return;

    // Block weak passwords before we even hit the network.
    const strength = evaluatePasswordStrength(password, [name, email]);
    if (!strength.isAcceptable) {
      setFieldErrors((prev) => ({
        ...prev,
        password: strength.warning ?? 'Please choose a stronger password.',
      }));
      return;
    }

    setIsSubmitting(true);
    try {
      // Breach check via HaveIBeenPwned. Fail open on a network error — a flaky
      // connection shouldn't stop someone from creating an account.
      try {
        if (await isPasswordBreached(password)) {
          setFieldErrors((prev) => ({
            ...prev,
            password: 'This password has appeared in a data breach. Please choose another one.',
          }));
          return;
        }
      } catch {
        // Breach service unreachable — proceed without the breach gate.
      }

      await signup(email.trim(), password, name.trim());
      await promptToEnableBiometricLogin();
      // New accounts start unverified — send them to enter the emailed code.
      // Signup already triggered the first send, hence sent=1.
      router.replace({ pathname: '/verify-email', params: { sent: '1' } });
    } catch (err) {
      setAuthError(friendlyError(err, 'Could not create your account. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resolves once the user has made a choice (or immediately if the device has
  // no biometrics), so the caller can then navigate on to email verification.
  const promptToEnableBiometricLogin = async (): Promise<void> => {
    const kind = await getBiometricKind();
    if (kind === 'none') return;

    const { title, label } = PROMPT_COPY_BY_KIND[kind];
    await new Promise<void>((resolve) => {
      Alert.alert(
        title,
        `Use ${label} to log in faster next time. You can turn this off anytime in your profile.`,
        [
          { text: 'Not now', style: 'cancel', onPress: () => resolve() },
          {
            text: 'Enable',
            onPress: () => {
              // Best-effort — the account already exists, so a failed opt-in
              // shouldn't block the user. They can enable it later in Profile.
              enableBiometricLogin()
                .catch(() => {})
                .finally(() => resolve());
            },
          },
        ],
        { onDismiss: () => resolve() }
      );
    });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AuthBackdrop />
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? spacing.xl : 0}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.brandMarkWrapper}>
            <BrandMark />
          </View>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Start banking with Vaultr</Text>

          <View style={styles.form}>
            <AuthTextField
              label="Full name"
              placeholder="Jane Doe"
              autoComplete="name"
              textContentType="name"
              value={name}
              editable={!isSubmitting}
              error={fieldErrors.name}
              onChangeText={(value) => {
                setName(value);
                revalidateIfAttempted({ name: value });
              }}
              onBlur={() => revalidateIfAttempted({})}
            />
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
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              secureTextEntry
              showToggle
              textContentType="newPassword"
              value={password}
              editable={!isSubmitting}
              error={fieldErrors.password}
              onChangeText={(value) => {
                setPassword(value);
                revalidateIfAttempted({ password: value });
              }}
              onBlur={() => revalidateIfAttempted({})}
              returnKeyType="next"
            />

            <PasswordStrengthMeter password={password} userInputs={[name, email]} />

            <AuthTextField
              label="Confirm password"
              placeholder="Re-enter your password"
              secureTextEntry
              showToggle
              textContentType="newPassword"
              value={confirmPassword}
              editable={!isSubmitting}
              error={fieldErrors.confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                revalidateIfAttempted({ confirmPassword: value });
              }}
              onBlur={() => revalidateIfAttempted({})}
              onSubmitEditing={handleSignup}
              returnKeyType="go"
            />

            {authError ? (
              <View style={styles.authErrorBanner} accessibilityRole="alert">
                <Text style={styles.authErrorText}>{authError}</Text>
              </View>
            ) : null}

            <View style={styles.submitSpacing}>
              <AuthButton title="Sign up" onPress={handleSignup} loading={isSubmitting} />
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account? </Text>
            <Pressable onPress={() => router.push('/(auth)/login')} disabled={isSubmitting} hitSlop={8}>
              <Text style={styles.switchLink}>Log in</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoider: {
    flex: 1,
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
  brandMarkWrapper: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
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
