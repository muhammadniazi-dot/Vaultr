import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { authenticateWithBiometrics, getBiometricKind, type BiometricKind } from '../services/auth';
import AuthButton from './AuthButton';

function labelForKind(kind: BiometricKind): string {
  switch (kind) {
    case 'face':
      return 'Continue with Face ID';
    case 'fingerprint':
      return 'Continue with Touch ID';
    case 'generic':
      return 'Continue with biometrics';
    default:
      return '';
  }
}

function iconNameForKind(kind: BiometricKind): 'face-recognition' | 'fingerprint' | 'shield-check-outline' | null {
  switch (kind) {
    case 'face':
      return 'face-recognition';
    case 'fingerprint':
      return 'fingerprint';
    case 'generic':
      return 'shield-check-outline';
    default:
      return null;
  }
}

// Cancellation isn't a failure worth alarming the user over — only surface a
// message for genuine errors they can act on.
const SILENT_ERROR_CODES = new Set(['user_cancel', 'app_cancel', 'system_cancel', 'user_fallback']);

interface BiometricLoginButtonProps {
  onError: (message: string | null) => void;
  onBusyChange?: (isBusy: boolean) => void;
}

export default function BiometricLoginButton({ onError, onBusyChange }: BiometricLoginButtonProps) {
  const { canUseBiometricLogin, isLoading: isAuthLoading, restoreSession } = useAuth();
  const [kind, setKind] = useState<BiometricKind>('none');
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Re-checks hardware/enrollment every time this screen is focused (not
  // just on first mount) — the login screen can stay mounted across
  // navigation (e.g. going to Signup and back), and biometric enrollment or
  // the user's stored preference can change in the background (Settings app,
  // enabling it from Profile, etc.), so a mount-only check can go stale.
  useFocusEffect(
    useCallback(() => {
      if (isAuthLoading) return;

      if (!canUseBiometricLogin) {
        setIsCheckingAvailability(false);
        setKind('none');
        return;
      }

      let cancelled = false;
      setIsCheckingAvailability(true);
      (async () => {
        const detected = await getBiometricKind();
        if (!cancelled) {
          setKind(detected);
          setIsCheckingAvailability(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [canUseBiometricLogin, isAuthLoading])
  );

  if (isAuthLoading || isCheckingAvailability || kind === 'none') {
    return null;
  }

  const handlePress = async () => {
    onError(null);
    setIsAuthenticating(true);
    onBusyChange?.(true);
    try {
      const result = await authenticateWithBiometrics(kind);

      if (result.success) {
        const restoredUser = await restoreSession();
        if (!restoredUser) {
          onError('Your biometric login has expired. Please log in with your password.');
        }
        return;
      }

      if (SILENT_ERROR_CODES.has(result.error)) {
        return;
      }
      if (result.error === 'lockout') {
        onError('Too many attempts. Please log in with your password.');
        return;
      }
      if (result.error === 'authentication_failed') {
        onError("We couldn't verify you. Please try again or log in with your password.");
        return;
      }
      onError('Biometric authentication failed. Please log in with your password.');
    } catch {
      onError('Could not start biometric authentication. Please log in with your password.');
    } finally {
      setIsAuthenticating(false);
      onBusyChange?.(false);
    }
  };

  const iconName = iconNameForKind(kind);

  return (
    <View style={styles.wrapper}>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>
      <AuthButton
        title={labelForKind(kind)}
        onPress={handlePress}
        loading={isAuthenticating}
        variant="secondary"
        icon={iconName ? <MaterialCommunityIcons name={iconName} size={18} color={colors.accentGold} /> : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginHorizontal: spacing.sm,
  },
});
