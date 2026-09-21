import { expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import { postgresAccounts } from '../src/infrastructure/database/accounts.ts';

type Query = (sql: string, values?: unknown[]) => Promise<{ rows: unknown[]; rowCount: number }>;

const STORED_DIGEST = 'scrypt-derivation-of-record';

function setup() {
  const query = vi.fn<Query>().mockResolvedValue({ rows: [], rowCount: 1 });
  const release = vi.fn();
  const pool = { query, connect: () => Promise.resolve({ query, release }) };

  return {
    query,
    release,
    accounts: postgresAccounts(pool as unknown as Pool),
    statements: () => query.mock.calls.map(([sql]) => sql),
    lastValues: () => query.mock.lastCall?.[1],
  };
}

const user = {
  id: '1',
  username: 'player_1',
  displayName: 'Player One',
  active: true,
  passwordHash: STORED_DIGEST,
};

const session = {
  tokenHash: 'token-hash',
  userId: '1',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  expiresAt: new Date('2026-01-02T00:00:00Z'),
  revokedAt: null,
};

it('reads users and sessions back as the port describes them', async () => {
  const { accounts, query } = setup();
  expect(await accounts.find('player_1')).toBeNull();
  query.mockResolvedValueOnce({ rows: [user], rowCount: 1 });
  expect(await accounts.find('player_1')).toEqual(user);

  query.mockResolvedValueOnce({ rows: [user], rowCount: 1 });
  expect(await accounts.list()).toEqual([user]);

  expect(await accounts.findSession('missing')).toBeNull();
  const row = { ...user, ...session };
  query.mockResolvedValueOnce({ rows: [row], rowCount: 1 });
  expect(await accounts.findSession('token-hash')).toEqual({ user: row, session: row });
});

it('never interpolates caller values into a statement', async () => {
  const { accounts, statements, lastValues } = setup();
  const secrets = ['player_1', 'Player One', STORED_DIGEST, 'token-hash'];

  await accounts.find('player_1');
  await accounts.create('player_1', 'Player One', STORED_DIGEST);
  expect(lastValues()).toEqual(['player_1', 'Player One', STORED_DIGEST]);
  await accounts.list();
  await accounts.saveSession(session, STORED_DIGEST);
  expect(lastValues()).toEqual([
    session.tokenHash,
    session.userId,
    session.createdAt,
    session.expiresAt,
    STORED_DIGEST,
  ]);
  await accounts.findSession('token-hash');
  expect(lastValues()).toEqual(['token-hash']);
  await accounts.revoke('token-hash', session.createdAt);
  expect(lastValues()).toEqual(['token-hash', session.createdAt]);
  await accounts.resetPassword('player_1', STORED_DIGEST);
  await accounts.deactivate('player_1');

  for (const sql of statements()) for (const secret of secrets) expect(sql).not.toContain(secret);
});

it('refuses to open a session when the account changed underneath the attempt', async () => {
  const { accounts, query } = setup();
  await expect(accounts.saveSession(session, STORED_DIGEST)).resolves.toBeUndefined();
  query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
  await expect(accounts.saveSession(session, 'stale-hash')).rejects.toThrow(
    'Invalid username or password',
  );
});

it('translates duplicate usernames but preserves other database errors', async () => {
  const { accounts, query } = setup();
  query.mockRejectedValueOnce({ code: '23505' });
  await expect(accounts.create('player_1', 'Player One', STORED_DIGEST)).rejects.toThrow(
    'Username already exists',
  );
  query.mockRejectedValueOnce(new Error('database unavailable'));
  await expect(accounts.create('player_1', 'Player One', STORED_DIGEST)).rejects.toThrow(
    'database unavailable',
  );
});

it('revokes sessions in the same transaction as account updates and rolls back failures', async () => {
  const { accounts, query, release, statements } = setup();
  query
    .mockResolvedValueOnce({ rows: [], rowCount: 0 })
    .mockResolvedValueOnce({ rows: [{ id: '1' }], rowCount: 1 });
  expect(await accounts.resetPassword('player_1', 'new-hash')).toBe(true);
  expect(statements()).toEqual([
    'BEGIN',
    expect.stringContaining('UPDATE users'),
    expect.stringContaining('UPDATE sessions'),
    'COMMIT',
  ]);
  expect(release).toHaveBeenCalledTimes(1);

  expect(await accounts.deactivate('missing')).toBe(false);
  expect(statements()).not.toContain('ROLLBACK');

  query
    .mockResolvedValueOnce({ rows: [], rowCount: 0 })
    .mockRejectedValueOnce(new Error('update failed'));
  await expect(accounts.deactivate('player_1')).rejects.toThrow('update failed');
  expect(query).toHaveBeenLastCalledWith('ROLLBACK');
  expect(release).toHaveBeenCalledTimes(3);
});
