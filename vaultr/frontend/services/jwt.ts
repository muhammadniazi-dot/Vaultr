const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Decodes a base64url string without relying on atob/Buffer, neither of
 * which is guaranteed to exist in the Hermes runtime. Display purposes only —
 * this does not verify the JWT signature.
 */
function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);

  let output = '';
  let buffer = 0;
  let bits = 0;

  for (const char of padded) {
    if (char === '=') break;
    const value = BASE64_CHARS.indexOf(char);
    if (value === -1) continue;

    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  return output;
}

export interface DecodedJwtPayload {
  iat?: number;
  exp?: number;
  userId?: string;
  [key: string]: unknown;
}

/**
 * Reads the payload of a JWT for display purposes (e.g. "last login" derived
 * from `iat`) without verifying its signature. Never use this for anything
 * security-sensitive — the backend is the source of truth for validity.
 */
export function decodeJwtPayload(token: string): DecodedJwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const json = base64UrlDecode(parts[1]);
    return JSON.parse(json) as DecodedJwtPayload;
  } catch {
    return null;
  }
}
