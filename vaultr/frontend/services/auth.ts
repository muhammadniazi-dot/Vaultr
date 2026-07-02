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

export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock Vaultr',
    fallbackLabel: 'Use passcode',
  });
  return result.success;
}
