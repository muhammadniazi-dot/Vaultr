import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { getBiometricKind, getStoredToken, type BiometricKind } from '../services/auth';
import { decodeJwtPayload } from '../services/jwt';

function labelForBiometricKind(kind: BiometricKind): string {
  switch (kind) {
    case 'face':
      return 'Face ID enabled';
    case 'fingerprint':
      return 'Touch ID enabled';
    case 'generic':
      return 'Biometric login enabled';
    default:
      return 'Biometric login not set up';
  }
}

function formatLastLogin(iatSeconds?: number): string {
  if (!iatSeconds) return 'Unknown';
  const date = new Date(iatSeconds * 1000);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface StatusRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  isPositive: boolean;
}

function StatusRow({ icon, label, isPositive }: StatusRowProps) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={isPositive ? colors.positive : colors.textMuted} />
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
  );
}

export default function SecurityCard() {
  const { user } = useAuth();
  const [biometricKind, setBiometricKind] = useState<BiometricKind>('none');
  const [lastLogin, setLastLogin] = useState<string>('Unknown');

  useEffect(() => {
    (async () => {
      const [kind, token] = await Promise.all([getBiometricKind(), getStoredToken()]);
      setBiometricKind(kind);
      if (token) {
        const payload = decodeJwtPayload(token);
        setLastLogin(formatLastLogin(payload?.iat));
      }
    })();
  }, []);

  return (
    <View style={styles.card}>
      <StatusRow
        icon={user?.emailVerified ? 'shield-checkmark-outline' : 'mail-unread-outline'}
        label={user?.emailVerified ? 'Email verified' : 'Email not verified'}
        isPositive={Boolean(user?.emailVerified)}
      />
      <StatusRow
        icon={biometricKind === 'none' ? 'finger-print-outline' : 'shield-checkmark-outline'}
        label={labelForBiometricKind(biometricKind)}
        isPositive={biometricKind !== 'none'}
      />
      <StatusRow icon="lock-closed-outline" label="Two-factor authentication not enabled" isPositive={false} />
      <View style={styles.row}>
        <Ionicons name="time-outline" size={18} color={colors.textMuted} />
        <Text style={styles.rowLabel}>Last login: {lastLogin}</Text>
      </View>
      <View style={[styles.row, styles.rowLast]}>
        <Ionicons name="checkmark-circle-outline" size={18} color={colors.positive} />
        <Text style={styles.rowLabel}>No security alerts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    flex: 1,
  },
});
