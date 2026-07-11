import zxcvbn from 'zxcvbn';
import * as Crypto from 'expo-crypto';

/**
 * Password strength (zxcvbn) and breach checking (HaveIBeenPwned k-anonymity).
 *
 * Privacy: the raw password never leaves the device. Breach checking hashes the
 * password locally with SHA-1 and sends only the first 5 hex chars of that hash
 * to the range API; the full hash, and the password itself, stay local. Nothing
 * in here logs the password or its hash.
 */

export type StrengthLabel = 'Weak' | 'Fair' | 'Good' | 'Strong';

export interface PasswordStrength {
  /** Raw zxcvbn score, 0 (worst) – 4 (best). */
  score: 0 | 1 | 2 | 3 | 4;
  label: StrengthLabel;
  /** zxcvbn's headline concern, if any (e.g. "This is a common password"). */
  warning?: string;
  /** Actionable tips, e.g. "Add another word or two". */
  suggestions: string[];
  /** True once the password is strong enough to accept (score ≥ MIN_ACCEPTABLE_SCORE). */
  isAcceptable: boolean;
}

/** Minimum zxcvbn score we'll accept: 2 = "Fair". Anything weaker is blocked. */
export const MIN_ACCEPTABLE_SCORE = 2;

const LABEL_BY_SCORE: Record<number, StrengthLabel> = {
  0: 'Weak',
  1: 'Weak',
  2: 'Fair',
  3: 'Good',
  4: 'Strong',
};

/**
 * Estimates password strength locally (no network). `userInputs` (e.g. the
 * user's name/email) let zxcvbn penalise passwords derived from them.
 */
export function evaluatePasswordStrength(password: string, userInputs: string[] = []): PasswordStrength {
  if (!password) {
    return { score: 0, label: 'Weak', suggestions: [], isAcceptable: false };
  }

  const { score, feedback } = zxcvbn(password, userInputs.filter(Boolean));
  const clamped = Math.max(0, Math.min(4, score)) as 0 | 1 | 2 | 3 | 4;

  return {
    score: clamped,
    label: LABEL_BY_SCORE[clamped],
    warning: feedback.warning || undefined,
    suggestions: feedback.suggestions ?? [],
    isAcceptable: clamped >= MIN_ACCEPTABLE_SCORE,
  };
}

/**
 * Returns true if the password appears in the HaveIBeenPwned breach corpus.
 *
 * Uses k-anonymity: SHA-1 the password, send only the 5-char prefix, and
 * compare the returned suffixes locally. `Add-Padding` asks the API to pad its
 * response so the number of returned hashes doesn't leak how many share the
 * prefix. Throws if the service can't be reached — callers decide whether to
 * fail open (a flaky network shouldn't hard-block signup).
 */
export async function isPasswordBreached(password: string): Promise<boolean> {
  const hash = (await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, password)).toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { 'Add-Padding': 'true' },
  });
  if (!response.ok) {
    throw new Error('Breach check service is unavailable');
  }

  const body = await response.text();
  for (const line of body.split('\n')) {
    const [lineSuffix, countRaw] = line.trim().split(':');
    if (lineSuffix === suffix) {
      const count = Number(countRaw);
      // Padded (fake) entries come back with a count of 0 — a real hit is > 0.
      return Number.isFinite(count) && count > 0;
    }
  }
  return false;
}
