import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { friendlyError } from '../../services/errors';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(trimmedEmail, password);
    } catch (err) {
      setError(friendlyError(err, 'Could not log you in. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Vaultr</Text>
      <Text style={styles.subtitle}>Log in to your account</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        editable={!isSubmitting}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={password}
        editable={!isSubmitting}
        onSubmitEditing={handleLogin}
        onChangeText={setPassword}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={styles.buttonText}>Log in</Text>
        )}
      </Pressable>
      <Pressable onPress={() => router.push('/(auth)/signup')} disabled={isSubmitting}>
        <Text style={styles.link}>Don&apos;t have an account? Sign up</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    color: colors.accentGold,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.button,
    color: colors.textPrimary,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: typography.sizes.md,
  },
  button: {
    backgroundColor: colors.accentGold,
    borderRadius: radius.button,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.background,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  link: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
