import type { Accounts, StoredSession, StoredUser } from '../../src/application/ports/accounts.ts';
import { AuthError } from '../../src/domain/users/auth-error.ts';

export function createMemoryAccounts(): Accounts {
  const users: StoredUser[] = [];
  const sessions: StoredSession[] = [];

  function revokeUser(userId: string) {
    for (const s of sessions) if (s.userId === userId) s.revokedAt = new Date();
  }

  return {
    find: (username) =>
      Promise.resolve(
        users.find((u) => u.username === username)
          ? { ...users.find((u) => u.username === username)! }
          : null,
      ),
    create: async (username, displayName, passwordHash) => {
      await Promise.resolve();
      if (users.some((u) => u.username === username))
        throw new AuthError('Username already exists');
      users.push({
        id: String(users.length + 1),
        username,
        displayName,
        passwordHash,
        active: true,
      });
    },
    resetPassword: async (username, passwordHash) => {
      await Promise.resolve();
      const user = users.find((u) => u.username === username);
      if (!user) return false;
      user.passwordHash = passwordHash;
      revokeUser(user.id);
      return true;
    },
    deactivate: async (username) => {
      await Promise.resolve();
      const user = users.find((u) => u.username === username);
      if (!user) return false;
      user.active = false;
      revokeUser(user.id);
      return true;
    },
    list: () => Promise.resolve(users.filter((u) => u.active)),
    saveSession: async (session, expectedPasswordHash) => {
      await Promise.resolve();
      if (
        !users.some(
          (user) =>
            user.id === session.userId && user.active && user.passwordHash === expectedPasswordHash,
        )
      )
        throw new AuthError('Invalid username or password', 'unauthorized');
      sessions.push(session);
    },
    findSession: async (hash) => {
      await Promise.resolve();
      const session = sessions.find((s) => s.tokenHash === hash);
      const user = users.find((u) => u.id === session?.userId);
      return session && user ? { session, user } : null;
    },
    revoke: async (hash, now) => {
      await Promise.resolve();
      const s = sessions.find((s) => s.tokenHash === hash);
      if (s) s.revokedAt = now;
    },
  };
}
