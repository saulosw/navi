import assert from 'node:assert/strict';
import { createPool } from '../apps/api/src/infrastructure/database/pool.ts';
import { postgresHealthProbe } from '../apps/api/src/infrastructure/database/postgres-health-probe.ts';
import { parseEnv } from '../apps/api/src/infrastructure/config/env.ts';
import { buildApp } from '../apps/api/src/main/build-app.ts';

const { DATABASE_URL } = parseEnv(process.env);
const pool = createPool(DATABASE_URL);
const app = buildApp(postgresHealthProbe(pool));
try {
  assert.equal((await app.inject('/ready')).statusCode, 200);
  const migrations = await pool.query('SELECT name FROM schema_migrations');
  assert.ok(migrations.rows.some(({ name }) => name === '001_users.sql'));
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const username = `smoke_${Date.now()}`;
    const values = [username, 'Smoke test', 'not-a-real-hash-only-for-rolled-back-smoke-test'];
    await client.query(
      'INSERT INTO users (username, display_name, password_hash) VALUES ($1, $2, $3)',
      values,
    );
    await assert.rejects(
      client.query(
        'INSERT INTO users (username, display_name, password_hash) VALUES ($1, $2, $3)',
        values,
      ),
      { code: '23505' },
    );
  } finally {
    await client.query('ROLLBACK');
    client.release();
  }
  console.info('Database readiness, migration and unique usernames verified');
} finally {
  await app.close();
  await pool.end();
}
