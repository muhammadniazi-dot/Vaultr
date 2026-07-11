import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { changePassword } from '../services/auth';
import { evaluatePasswordStrength, isPasswordBreached } from '../services/passwordSecurity';
import { friendlyError } from '../services/errors';
import AuthTextField from '../components/AuthTextField';
import AuthButton from '../components/AuthButton';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

interface FieldErrors {
  current?: string;
  next?: string;
  confirm?: string;
}

export default function ChangePasswordScreen() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitError(null);

    const errors: FieldErrors = {};
    if (!currentPassword) errors.current = 'Enter your current password.';
    if (!newPassword) {
      errors.next = 'Enter a new password.';
    } else {
      const strength = evaluatePasswordStrength(newPassword, [user?.name, user?.email].filter(Boolean) as string[]);
      if (!strength.isAcceptable) {
        errors.next = strength.warning ?? 'Please choose a stronger password.';
      }
    }
    if (newPassword && confirmPassword !== newPassword) {
      errors.confirm = 'Passwords do not match.';
    }
    setFieldErrors(errors);
    if (errors.current || errors.next || errors.confirm) return;

    setIsSubmitting(true);
    try {
      // Fail open if the breach service is unreachable.
      try {
        if (await isPasswordBreached(newPassword)) {
          setFieldErrors({ next: 'This password has appeared in a data breach. Please choose another one.' });
          return;
        }
      } catch {
        // Network issue — skip the breach gate rather than block the change.
      }

      await changePassword(currentPassword, newPassword);
      Alert.alert('Password updated', 'Your password has been changed successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      setSubmitError(friendlyError(err, 'Could not change your password. Please try again.'));
    } finally {
      setIsSubmitting(false);
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
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>Change password</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>
          Choose a strong password you don&apos;t use anywhere else.
        </Text>

        <AuthTextField
          label="Current password"
          placeholder="Your current password"
          secureTextEntry
          textContentType="password"
          value={currentPassword}
          editable={!isSubmitting}
          error={fieldErrors.current}
          onChangeText={setCurrentPassword}
        />

        <AuthTextField
          label="New password"
          placeholder="At least 8 characters"
          secureTextEntry
          textContentType="newPassword"
          value={newPassword}
          editable={!isSubmitting}
          error={fieldErrors.next}
          onChangeText={setNewPassword}
        />
        <PasswordStrengthMeter
          password={newPassword}
          userInputs={[user.name, user.email].filter(Boolean) as string[]}
        />

        <AuthTextField
          label="Confirm new password"
          placeholder="Re-enter your new password"
          secureTextEntry
          textContentType="newPassword"
          value={confirmPassword}
          editable={!isSubmitting}
          error={fieldErrors.confirm}
          onChangeText={setConfirmPassword}
          onSubmitEditing={handleSubmit}
          returnKeyType="go"
        />

        {submitError ? (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Text style={styles.errorText}>{submitError}</Text>
          </View>
        ) : null}

        <View style={styles.submitSpacing}>
          <AuthButton title="Update password" onPress={handleSubmit} loading={isSubmitting} />
        </View>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  topBarTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xl,
  },
  errorBanner: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.button,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.sizes.sm,
  },
  submitSpacing: {
    marginTop: spacing.sm,
  },
});
