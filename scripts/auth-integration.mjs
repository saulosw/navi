import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import pg from 'pg';
import { URL } from 'node:url';
import { createPool } from '../apps/api/src/infrastructure/database/pool.ts';
import { postgresAccounts } from '../apps/api/src/infrastructure/database/accounts.ts';
import { createAuth } from '../apps/api/src/application/auth.ts';
import { passwordHasher, tokenService } from '../apps/api/src/infrastructure/security/crypto.ts';
import { buildApp } from '../apps/api/src/main/build-app.ts';
if (!process.env.TEST_DATABASE_URL)
  throw new Error('Set TEST_DATABASE_URL to a disposable PostgreSQL server');
const database = `navi_auth_${randomUUID().replaceAll('-', '')}`;
const admin = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
await admin.connect();
let pool;
let app;
let created = false;
try {
  // eslint-disable-next-line sonarjs/sql-queries
  await admin.query('CREATE DATABASE ' + pg.escapeIdentifier(database));
  created = true;
  const url = new URL(process.env.TEST_DATABASE_URL);
  url.pathname = `/${database}`;
  const env = { ...process.env, DATABASE_URL: url.href };
  execFileSync(process.execPath, ['apps/api/src/infrastructure/database/migrate.ts'], {
    env,
    stdio: 'pipe',
  });
  execFileSync(process.execPath, ['apps/api/src/infrastructure/database/migrate.ts'], {
    env,
    stdio: 'pipe',
  });
  pool = createPool(url.href);
  const accounts = postgresAccounts(pool);
  const auth = createAuth({
    accounts,
    passwords: passwordHasher,
    tokens: tokenService,
    clock: Date.now,
  });
  const password = randomUUID();
  await auth.createUser('player_1', 'Player One', password);
  await auth.createUser('player_2', 'Player Two', randomUUID());
  await assert.rejects(auth.createUser('player_1', 'Duplicate', password), /already exists/);
  app = buildApp({ check: () => pool.query('SELECT 1').then(() => undefined) }, undefined, auth);
  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { username: 'player_1', password, remember: true },
  });
  assert.equal(response.statusCode, 200);
  const { token, expiresAt } = response.json();
  const headers = { authorization: `Bearer ${token}` };
  const active = await app.inject({ url: '/auth/session', headers });
  assert.equal(active.statusCode, 200);
  assert.equal(active.json().user.username, 'player_1');
  assert.equal(active.json().expiresAt, expiresAt);
  assert.ok(Date.parse(expiresAt) > Date.now());
  const members = await app.inject({ url: '/members', headers });
  assert.equal(members.statusCode, 200);
  assert.equal(members.json().length, 2);
  assert.equal(members.body.includes('password'), false);
  const stored = await pool.query('SELECT token_hash FROM sessions');
  assert.equal(stored.rows[0].token_hash, tokenService.digest(token));
  await auth.resetPassword('player_1', password);
  assert.equal((await app.inject({ url: '/auth/session', headers })).statusCode, 401);
  const second = await auth.login('player_1', password, false, 'local');
  await auth.deactivate('player_1');
  await assert.rejects(auth.session(second.token), /Session expired/);
  assert.equal((await accounts.list()).length, 1);
  assert.equal(await accounts.deactivate('missing'), false);
  assert.equal(await accounts.resetPassword('missing', 'hash'), false);
  console.info('Isolated PostgreSQL migrations, provisioning, HTTP auth and revocation verified.');
} finally {
  await app?.close();
  await pool?.end();
  if (created)
    // eslint-disable-next-line sonarjs/sql-queries
    await admin.query('DROP DATABASE ' + pg.escapeIdentifier(database) + ' WITH (FORCE)');
  await admin.end();
}
