import api from './api';
import type { User } from '../types';

/** Requests a fresh verification code for the signed-in user's email. */
export async function sendVerificationEmail(): Promise<void> {
  await api.post('/auth/send-verification-email');
}

/** Rate-limited re-send of the verification code. */
export async function resendVerificationEmail(): Promise<void> {
  await api.post('/auth/resend-verification-email');
}

/** Submits a 6-digit code; returns the updated (now verified) user on success. */
export async function verifyEmail(code: string): Promise<User> {
  const { data } = await api.post<{ user: User }>('/auth/verify-email', { code });
  return data.user;
}
