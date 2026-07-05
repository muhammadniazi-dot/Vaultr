import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
}

export default function AuthButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon,
}: AuthButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isInactive = disabled || loading;
  const isSecondary = variant === 'secondary';

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        isSecondary && styles.buttonSecondary,
        isHovered && !isInactive && (isSecondary ? styles.buttonSecondaryHovered : styles.buttonHovered),
        pressed && !isInactive && (isSecondary ? styles.buttonSecondaryPressed : styles.buttonPressed),
        isInactive && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? colors.accentGold : colors.background} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.text, isSecondary && styles.textSecondary]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.accentGold,
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accentGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonHovered: {
    backgroundColor: '#d4b45c',
  },
  buttonPressed: {
    backgroundColor: '#b8974a',
    transform: [{ scale: 0.98 }],
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonSecondaryHovered: {
    borderColor: colors.accentGold,
    backgroundColor: colors.accentGoldFaint,
  },
  buttonSecondaryPressed: {
    borderColor: colors.accentGold,
    backgroundColor: colors.accentGoldSoft,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    color: colors.background,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  textSecondary: {
    color: colors.textPrimary,
  },
});
