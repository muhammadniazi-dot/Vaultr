const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return 'Email is required.';
  if (!EMAIL_PATTERN.test(trimmed)) return 'Enter a valid email address.';
  return undefined;
}

export function validatePassword(value: string, minLength = 1): string | undefined {
  if (!value) return 'Password is required.';
  if (minLength > 1 && value.length < minLength) {
    return `Must be at least ${minLength} characters.`;
  }
  return undefined;
}

export function validateName(value: string): string | undefined {
  if (!value.trim()) return 'Full name is required.';
  return undefined;
}

export function validatePasswordMatch(password: string, confirmPassword: string): string | undefined {
  if (!confirmPassword) return 'Please confirm your password.';
  if (confirmPassword !== password) return 'Passwords do not match.';
  return undefined;
}
