import type { Pool } from 'pg';
import type { Accounts, StoredSession, StoredUser } from '../../application/ports/accounts.ts';
import { AuthError } from '../../domain/users/auth-error.ts';

const userColumns = 'id, username, display_name AS "displayName", active';

export function postgresAccounts(pool: Pool): Accounts {
  async function updateUser(username: string, query: string, values: string[]) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<{ id: string }>(query, [username, ...values]);
      const user = result.rows[0];
      if (user)
        await client.query(
          'UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
          [user.id],
        );
      await client.query('COMMIT');
      return Boolean(user);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  return {
    async find(username) {
      const result = await pool.query<StoredUser>(
        `SELECT ${userColumns}, password_hash AS "passwordHash" FROM users WHERE username = $1`,
        [username],
      );
      return result.rows[0] ?? null;
    },
    async create(username, displayName, passwordHash) {
      try {
        await pool.query(
          'INSERT INTO users(username, display_name, password_hash) VALUES ($1, $2, $3)',
          [username, displayName, passwordHash],
        );
      } catch (error) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === '23505'
        )
          throw new AuthError('Username already exists');
        throw error;
      }
    },
    resetPassword: (username, hash) =>
      updateUser(username, 'UPDATE users SET password_hash = $2 WHERE username = $1 RETURNING id', [
        hash,
      ]),
    deactivate: (username) =>
      updateUser(username, 'UPDATE users SET active = false WHERE username = $1 RETURNING id', []),
    async list() {
      return (
        await pool.query<StoredUser>(
          `SELECT ${userColumns} FROM users WHERE active = true ORDER BY display_name, id`,
        )
      ).rows;
    },
    async saveSession(session, expectedPasswordHash) {
      const result = await pool.query(
        'INSERT INTO sessions(token_hash,user_id,created_at,expires_at) SELECT $1, id, $3, $4 FROM users WHERE id = $2 AND active = true AND password_hash = $5 FOR UPDATE',
        [
          session.tokenHash,
          session.userId,
          session.createdAt,
          session.expiresAt,
          expectedPasswordHash,
        ],
      );
      if (result.rowCount !== 1)
        throw new AuthError('Invalid username or password', 'unauthorized');
    },
    async findSession(hash) {
      const result = await pool.query<StoredSession & StoredUser>(
        `SELECT u.id, u.username, u.display_name AS "displayName", u.active, s.token_hash AS "tokenHash", s.user_id AS "userId", s.created_at AS "createdAt", s.expires_at AS "expiresAt", s.revoked_at AS "revokedAt" FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1`,
        [hash],
      );
      const row = result.rows[0];
      return row ? { session: row, user: row } : null;
    },
    async revoke(hash, now) {
      await pool.query(
        'UPDATE sessions SET revoked_at = $2 WHERE token_hash = $1 AND revoked_at IS NULL',
        [hash, now],
      );
    },
  };
}
