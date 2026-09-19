import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/main/build-app.ts';

describe('health endpoints', () => {
  it('keeps liveness independent of database availability', async () => {
    const app = buildApp({
      check: () => Promise.reject(new Error('secret database URL')),
    });
    try {
      const live = await app.inject('/health');
      expect(live.statusCode).toBe(200);
      expect(live.json()).toEqual({ status: 'ok' });
      const ready = await app.inject('/ready');
      expect(ready.statusCode).toBe(503);
      expect(ready.json()).toEqual({ status: 'unavailable' });
      expect(ready.body).not.toContain('secret');
    } finally {
      await app.close();
    }
  });
  it('reports readiness when the database responds', async () => {
    const app = buildApp({ check: () => Promise.resolve() });
    try {
      const response = await app.inject('/ready');
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ status: 'ok' });
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    } finally {
      await app.close();
    }
  });
  it('keeps a configured logger from changing the responses', async () => {
    const app = buildApp({ check: () => Promise.resolve() }, 'silent');
    try {
      expect((await app.inject('/health')).statusCode).toBe(200);
      expect((await app.inject('/ready')).statusCode).toBe(200);
    } finally {
      await app.close();
    }
  });
  it('does not expose public registration', async () => {
    const app = buildApp({ check: () => Promise.resolve() });
    try {
      expect((await app.inject({ method: 'POST', url: '/register' })).statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });
});
