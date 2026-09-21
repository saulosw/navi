import type { User } from '../../domain/users/user.ts';

export interface StoredUser extends User {
  passwordHash: string;
}

export interface StoredSession {
  tokenHash: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface Accounts {
  find(username: string): Promise<StoredUser | null>;
  create(username: string, displayName: string, passwordHash: string): Promise<void>;
  resetPassword(username: string, passwordHash: string): Promise<boolean>;
  deactivate(username: string): Promise<boolean>;
  list(): Promise<User[]>;
  saveSession(session: StoredSession, expectedPasswordHash: string): Promise<void>;
  findSession(tokenHash: string): Promise<{ session: StoredSession; user: User } | null>;
  revoke(tokenHash: string, now: Date): Promise<void>;
}

export interface AuthDependencies {
  accounts: Accounts;
  passwords: {
    hash(password: string): Promise<string>;
    verify(password: string, hash: string): Promise<boolean>;
  };
  tokens: { create(): string; digest(token: string): string };
  clock: () => number;
}
