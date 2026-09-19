import { expect, it, vi } from 'vitest';
import type pg from 'pg';
import { postgresHealthProbe } from '../src/infrastructure/database/postgres-health-probe.ts';

function poolStub(query: pg.Pool['query']) {
  return { query } as unknown as pg.Pool;
}

it('resolves when the database answers a trivial query', async () => {
  const query = vi.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] });
  await expect(postgresHealthProbe(poolStub(query)).check()).resolves.toBeUndefined();
  expect(query).toHaveBeenCalledWith('SELECT 1');
});

it('propagates the failure so readiness can report it without leaking details', async () => {
  const query = vi.fn().mockRejectedValue(new Error('connection refused'));
  await expect(postgresHealthProbe(poolStub(query)).check()).rejects.toThrow('connection refused');
});
