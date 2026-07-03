import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function AuthButton({ title, onPress, loading = false, disabled = false }: AuthButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isInactive = disabled || loading;

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
        isHovered && !isInactive && styles.buttonHovered,
        pressed && !isInactive && styles.buttonPressed,
        isInactive && styles.buttonDisabled,
      ]}
    >
      {loading ? <ActivityIndicator color={colors.background} /> : <Text style={styles.text}>{title}</Text>}
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
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  text: {
    color: colors.background,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
