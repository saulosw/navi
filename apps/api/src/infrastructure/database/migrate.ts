import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import pg from 'pg';
import { parseEnv } from '../config/env.ts';

const env = parseEnv(process.env);
const client = new pg.Client({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 5000 });
try {
  await client.connect();
  await client.query('BEGIN');
  await client.query("SELECT pg_advisory_xact_lock(hashtext('navi-migrations'))");
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const directory = new URL('./migrations/', import.meta.url);
  // Ordered by numeric version so a future 010_ never sorts before 9_.
  const names = (await readdir(directory))
    .filter((name) => /^\d+_.+\.sql$/.test(name))
    .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10) || a.localeCompare(b, 'en'));
  for (const name of names) {
    const sql = await readFile(new URL(name, directory), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const applied = await client.query<{ checksum: string }>(
      'SELECT checksum FROM schema_migrations WHERE name = $1',
      [name],
    );
    if (applied.rows[0]) {
      if (applied.rows[0].checksum !== checksum) throw new Error('Applied migration changed');
      continue;
    }
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)', [
      name,
      checksum,
    ]);
    console.info(`Applied ${name}`);
  }
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK').catch(() => undefined);
  // Only the message is logged: pg error messages never carry the connection string.
  const reason = error instanceof Error ? error.message : 'unknown error';
  console.error(
    `Migration failed; verify database availability and migration integrity: ${reason}`,
  );
  process.exitCode = 1;
} finally {
  await client.end();
}
