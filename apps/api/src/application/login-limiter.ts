import { AuthError } from '../domain/users/auth-error.ts';

const WINDOW_MS = 900_000;

const IP_LIMIT = 30;

const USER_LIMIT = 5;

const MAX_KEYS = 10_000;

export interface LoginLimiter {
  check(username: string, ip: string): void;
  fail(username: string, ip: string): void;
  succeed(username: string): void;
}

export function createLoginLimiter(clock: () => number): LoginLimiter {
  const attempts = new Map<string, { count: number; expires: number }>();

  function prune(now: number) {
    for (const [key, bucket] of attempts) if (bucket.expires <= now) attempts.delete(key);
    while (attempts.size >= MAX_KEYS) {
      const oldest = attempts.keys().next();
      if (oldest.done) break;
      attempts.delete(oldest.value);
    }
  }

  function count(key: string, now: number) {
    const bucket = attempts.get(key);
    return bucket && bucket.expires > now ? bucket.count : 0;
  }

  function bump(key: string, now: number) {
    const bucket = attempts.get(key);
    if (bucket && bucket.expires > now) bucket.count++;
    else attempts.set(key, { count: 1, expires: now + WINDOW_MS });
  }

  return {
    check(username, ip) {
      const now = clock();
      prune(now);
      if (count(`ip:${ip}`, now) >= IP_LIMIT || count(`user:${username}`, now) >= USER_LIMIT)
        throw new AuthError('Too many attempts. Try again later.', 'rate-limited');
    },
    fail(username, ip) {
      const now = clock();
      prune(now);
      bump(`ip:${ip}`, now);
      bump(`user:${username}`, now);
    },
    succeed(username) {
      attempts.delete(`user:${username}`);
    },
  };
}
