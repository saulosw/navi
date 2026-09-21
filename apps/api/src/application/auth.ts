import type { AuthDependencies, StoredUser } from './ports/accounts.ts';
import { AuthError } from '../domain/users/auth-error.ts';
import { parseUsername } from '../domain/users/username.ts';
import type { User } from '../domain/users/user.ts';
import { createLoginLimiter } from './login-limiter.ts';

const MAX_QUEUED_VERIFICATIONS = 8;

function profile(user: User) {
  return { id: user.id, username: user.username, displayName: user.displayName };
}

function validPassword(password: string) {
  if (password.length < 15 || password.length > 128)
    throw new AuthError('Password must contain 15–128 characters');
}

export function createAuth({ accounts, passwords, tokens, clock }: AuthDependencies) {
  const limiter = createLoginLimiter(clock);
  let queued = 0;
  let chain: Promise<unknown> = Promise.resolve();
  let dummy: Promise<string> | undefined;

  function dummyHash() {
    const pending = passwords.hash(tokens.create());
    pending.catch(() => {
      if (dummy === pending) dummy = undefined;
    });
    return pending;
  }

  async function verify(password: string, user: StoredUser | null) {
    if (queued >= MAX_QUEUED_VERIFICATIONS)
      throw new AuthError('Too many attempts. Try again later.', 'rate-limited');
    queued++;

    const attempt = chain.then(async () => {
      dummy ??= dummyHash();
      const fallback = await dummy;
      return passwords.verify(password, user?.passwordHash ?? fallback);
    });
    chain = attempt.then(
      () => undefined,
      () => undefined,
    );
    try {
      return await attempt;
    } finally {
      queued--;
    }
  }

  async function authorize(token: string) {
    const found = await accounts.findSession(tokens.digest(token));
    if (
      !found ||
      !found.user.active ||
      found.session.revokedAt ||
      found.session.expiresAt.getTime() <= clock()
    )
      throw new AuthError('Session expired. Sign in again.', 'unauthorized');
    return found;
  }

  return {
    async session(token: string) {
      const { user, session } = await authorize(token);
      return { user: profile(user), expiresAt: session.expiresAt.toISOString() };
    },
    async login(username: string, password: string, remember: boolean, ip: string) {
      const normalized = username.trim().toLowerCase();
      limiter.check(normalized, ip);
      const user = await accounts.find(normalized);
      const valid = await verify(password, user);
      if (!valid || !user?.active) {
        limiter.fail(normalized, ip);
        throw new AuthError('Invalid username or password', 'unauthorized');
      }
      const token = tokens.create();
      const expiresAt = new Date(clock() + (remember ? 30 * 86400_000 : 12 * 3600_000));
      await accounts.saveSession(
        {
          tokenHash: tokens.digest(token),
          userId: user.id,
          createdAt: new Date(clock()),
          expiresAt,
          revokedAt: null,
        },
        user.passwordHash,
      );
      limiter.succeed(normalized);
      return { token, expiresAt: expiresAt.toISOString(), user: profile(user) };
    },
    async members(token: string) {
      await authorize(token);
      return (await accounts.list()).map(profile);
    },
    async logout(token: string) {
      await accounts.revoke(tokens.digest(token), new Date(clock()));
    },
    async createUser(username: string, displayName: string, password: string) {
      const normalized = parseUsername(username);
      validPassword(password);
      if (!displayName.trim() || displayName.trim().length > 80)
        throw new AuthError('Display name must contain 1–80 characters');
      await accounts.create(normalized, displayName.trim(), await passwords.hash(password));
    },
    async resetPassword(username: string, password: string) {
      validPassword(password);
      if (!(await accounts.resetPassword(parseUsername(username), await passwords.hash(password))))
        throw new AuthError('User not found', 'not-found');
    },
    async deactivate(username: string) {
      if (!(await accounts.deactivate(parseUsername(username))))
        throw new AuthError('User not found', 'not-found');
    },
  };
}

export type Auth = ReturnType<typeof createAuth>;
