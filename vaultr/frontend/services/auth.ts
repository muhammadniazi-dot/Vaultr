import * as LocalAuthentication from 'expo-local-authentication';
import api, { TOKEN_KEY } from './api';
import * as secureStorage from './secureStorage';
import type { AuthResponse, User } from '../types';

const USER_KEY = 'vaultr_auth_user';

// Separate from the active-session keys above. These survive `logout()` on
// purpose — logging out ends the current session but must not delete the
// user's biometric login enrollment. They're only cleared by
// `disableBiometricLogin()`, i.e. the user explicitly turning it off.
const BIOMETRIC_TOKEN_KEY = 'vaultr_biometric_token';
const BIOMETRIC_USER_KEY = 'vaultr_biometric_user';
const BIOMETRIC_ENABLED_KEY = 'vaultr_biometric_enabled';

export async function login(email: string, password: string): Promise<User> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  await secureStorage.setItemAsync(TOKEN_KEY, data.token);
  await secureStorage.setItemAsync(USER_KEY, JSON.stringify(data.user));

  // Keep the biometric copy in sync so a fresh password login doesn't leave
  // Face ID pointing at a stale token, for users who already opted in.
  if (await isBiometricLoginEnabled()) {
    await enableBiometricLogin(data.token, data.user);
  }

  return data.user;
}

export async function signup(email: string, password: string, name: string): Promise<User> {
  const { data } = await api.post<AuthResponse>('/auth/signup', { email, password, name });
  await secureStorage.setItemAsync(TOKEN_KEY, data.token);
  await secureStorage.setItemAsync(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

/**
 * Ends the current session only. Deliberately does not touch the biometric
 * keys — signing out must not remove the saved Face ID/Touch ID login unless
 * the user explicitly disables it via `disableBiometricLogin()`.
 */
export async function logout(): Promise<void> {
  await secureStorage.deleteItemAsync(TOKEN_KEY);
  await secureStorage.deleteItemAsync(USER_KEY);
}

export async function getStoredToken(): Promise<string | null> {
  return secureStorage.getItemAsync(TOKEN_KEY);
}

/**
 * Writes the given token/user into the active-session keys — used after a
 * successful biometric check to rehydrate the session that `logout()`
 * cleared, so `api.ts`'s request interceptor (which reads the active
 * `TOKEN_KEY`) has a token to attach to subsequent requests.
 */
export async function activateSession(token: string, user: User): Promise<void> {
  await secureStorage.setItemAsync(TOKEN_KEY, token);
  await secureStorage.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getStoredUser(): Promise<User | null> {
  const raw = await secureStorage.getItemAsync(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}

export async function isBiometricLoginEnabled(): Promise<boolean> {
  return (await secureStorage.getItemAsync(BIOMETRIC_ENABLED_KEY)) === 'true';
}

export async function getStoredBiometricToken(): Promise<string | null> {
  return secureStorage.getItemAsync(BIOMETRIC_TOKEN_KEY);
}

export async function getStoredBiometricUser(): Promise<User | null> {
  const raw = await secureStorage.getItemAsync(BIOMETRIC_USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}

/** Opts in to biometric login: stores a dedicated copy of the token/user that survives logout. */
export async function enableBiometricLogin(token: string, user: User): Promise<void> {
  await secureStorage.setItemAsync(BIOMETRIC_TOKEN_KEY, token);
  await secureStorage.setItemAsync(BIOMETRIC_USER_KEY, JSON.stringify(user));
  await secureStorage.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
}

/** Explicit opt-out — the only thing that should ever remove the biometric login copy. */
export async function disableBiometricLogin(): Promise<void> {
  await secureStorage.deleteItemAsync(BIOMETRIC_TOKEN_KEY);
  await secureStorage.deleteItemAsync(BIOMETRIC_USER_KEY);
  await secureStorage.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
}

export type BiometricKind = 'face' | 'fingerprint' | 'generic' | 'none';

/**
 * Checks hardware support, enrollment, and which biometric type is available
 * so the UI can show accurate wording (e.g. never say "Face ID" on a device
 * that only has a fingerprint sensor).
 */
export async function getBiometricKind(): Promise<BiometricKind> {
  const [compatible, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  if (!compatible || !enrolled) {
    return 'none';
  }

  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'face';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'fingerprint';
  }
  return types.length > 0 ? 'generic' : 'none';
}

const PROMPT_MESSAGE_BY_KIND: Record<BiometricKind, string> = {
  face: 'Log in with Face ID',
  fingerprint: 'Log in with Touch ID',
  generic: 'Log in to Vaultr',
  none: 'Log in to Vaultr',
};

export async function authenticateWithBiometrics(
  kind: BiometricKind = 'generic'
): Promise<LocalAuthentication.LocalAuthenticationResult> {
  return LocalAuthentication.authenticateAsync({
    promptMessage: PROMPT_MESSAGE_BY_KIND[kind],
    cancelLabel: 'Cancel',
    // Without this, iOS/Android happily let the user tap "Use passcode" and
    // skip biometrics entirely — the opposite of what a Face ID button
    // should do. This forces biometrics-only (LAPolicyDeviceOwnerAuthentication
    // WithBiometrics on iOS instead of the fallback-permitting default), so
    // there's no immediate drop to the device passcode. `fallbackLabel` is
    // intentionally omitted — it has no effect once fallback is disabled.
    disableDeviceFallback: true,
  });
}
