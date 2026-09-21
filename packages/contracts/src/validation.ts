import type { LoginInput, Member } from './index.ts';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isMember(value: unknown): value is Member {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.username === 'string' &&
    /^[a-z0-9_]{3,32}$/.test(value.username) &&
    typeof value.displayName === 'string' &&
    value.displayName.trim().length > 0 &&
    value.displayName.length <= 80
  );
}

export function isLoginInput(value: unknown): value is LoginInput {
  return (
    isRecord(value) &&
    typeof value.username === 'string' &&
    value.username.trim().length > 0 &&
    value.username.length <= 32 &&
    typeof value.password === 'string' &&
    value.password.length > 0 &&
    value.password.length <= 128 &&
    typeof value.remember === 'boolean' &&
    Object.keys(value).length === 3
  );
}
