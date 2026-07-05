import * as LocalAuthentication from 'expo-local-authentication';
import api, { TOKEN_KEY } from './api';
import * as secureStorage from './secureStorage';
import type { AuthResponse, User } from '../types';

const USER_KEY = 'vaultr_auth_user';

export async function login(email: string, password: string): Promise<User> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  await secureStorage.setItemAsync(TOKEN_KEY, data.token);
  await secureStorage.setItemAsync(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export async function signup(email: string, password: string, name: string): Promise<User> {
  const { data } = await api.post<AuthResponse>('/auth/signup', { email, password, name });
  await secureStorage.setItemAsync(TOKEN_KEY, data.token);
  await secureStorage.setItemAsync(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export async function logout(): Promise<void> {
  await secureStorage.deleteItemAsync(TOKEN_KEY);
  await secureStorage.deleteItemAsync(USER_KEY);
}

export async function getStoredToken(): Promise<string | null> {
  return secureStorage.getItemAsync(TOKEN_KEY);
}

export async function getStoredUser(): Promise<User | null> {
  const raw = await secureStorage.getItemAsync(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
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

export async function authenticateWithBiometrics(): Promise<LocalAuthentication.LocalAuthenticationResult> {
  return LocalAuthentication.authenticateAsync({
    promptMessage: 'Log in to Vaultr',
    fallbackLabel: 'Use passcode',
    cancelLabel: 'Cancel',
  });
}
