import { AuthError } from './auth-error.ts';

export function parseUsername(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,32}$/.test(normalized))
    throw new AuthError('Username must contain 3–32 lowercase letters, digits or underscores');
  return normalized;
}
