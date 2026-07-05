import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { getBiometricKind, type BiometricKind } from '../../services/auth';

const LABEL_BY_KIND: Record<Exclude<BiometricKind, 'none'>, string> = {
  face: 'Face ID login',
  fingerprint: 'Touch ID login',
  generic: 'Biometric login',
};

export default function ProfileScreen() {
  const { user, logout, canUseBiometricLogin, enableBiometricLogin, disableBiometricLogin } = useAuth();
  const [biometricKind, setBiometricKind] = useState<BiometricKind>('none');
  const [isCheckingBiometrics, setIsCheckingBiometrics] = useState(true);
  const [isTogglingBiometrics, setIsTogglingBiometrics] = useState(false);

  useEffect(() => {
    (async () => {
      setBiometricKind(await getBiometricKind());
      setIsCheckingBiometrics(false);
    })();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const handleToggleBiometrics = async () => {
    setIsTogglingBiometrics(true);
    try {
      if (canUseBiometricLogin) {
        await disableBiometricLogin();
      } else {
        await enableBiometricLogin();
      }
    } catch (err) {
      Alert.alert('Something went wrong', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsTogglingBiometrics(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.card}>
        <Text style={styles.name}>{user?.name ?? 'Guest'}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
      </View>

      {isCheckingBiometrics ? null : biometricKind !== 'none' ? (
        <View style={styles.card}>
          <View style={styles.biometricRow}>
            <View style={styles.biometricText}>
              <Text style={styles.biometricLabel}>{LABEL_BY_KIND[biometricKind]}</Text>
              <Text style={styles.biometricStatus}>{canUseBiometricLogin ? 'Enabled' : 'Not enabled'}</Text>
            </View>
            {isTogglingBiometrics ? (
              <ActivityIndicator color={colors.accentGold} />
            ) : (
              <Pressable onPress={handleToggleBiometrics} hitSlop={8}>
                <Text style={styles.biometricAction}>{canUseBiometricLogin ? 'Turn off' : 'Turn on'}</Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : null}

      <Pressable style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log out</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginVertical: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  email: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  biometricText: {
    flex: 1,
  },
  biometricLabel: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  biometricStatus: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  biometricAction: {
    color: colors.accentGold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  button: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.button,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  buttonText: {
    color: colors.danger,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
