import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../constants/theme';

interface AuthTextFieldProps extends Omit<TextInputProps, 'style' | 'onBlur'> {
  label: string;
  error?: string;
  onBlur?: () => void;
  /**
   * Shows an eye/eye-off button that toggles plaintext visibility. Only
   * meaningful alongside `secureTextEntry` — when set, this component owns
   * the actual secure/plaintext state instead of the caller's `secureTextEntry`.
   */
  showToggle?: boolean;
}

export default function AuthTextField({
  label,
  error,
  onBlur,
  editable = true,
  showToggle = false,
  secureTextEntry,
  ...inputProps
}: AuthTextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const hasError = Boolean(error);
  const isActuallySecure = showToggle ? secureTextEntry && !isRevealed : secureTextEntry;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          {...inputProps}
          secureTextEntry={isActuallySecure}
          editable={editable}
          placeholderTextColor={colors.textMuted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          style={[
            styles.input,
            showToggle && styles.inputWithToggle,
            isFocused && !hasError && styles.inputFocused,
            hasError && styles.inputError,
            !editable && styles.inputDisabled,
          ]}
          accessibilityLabel={label}
        />
        {showToggle ? (
          <Pressable
            onPress={() => setIsRevealed((prev) => !prev)}
            hitSlop={8}
            style={styles.toggleButton}
            accessibilityRole="button"
            accessibilityLabel={isRevealed ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={isRevealed ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    justifyContent: 'center',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
  },
  inputWithToggle: {
    paddingRight: spacing.xxl,
  },
  inputFocused: {
    borderColor: colors.accentGold,
    shadowColor: colors.accentGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 2,
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  toggleButton: {
    position: 'absolute',
    right: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
});
