import { expect, it } from 'vitest';
import { createSessionClient, validateEndpoint } from '../src/main/auth/session-client';

function addressOf(value: string | URL | Request) {
  if (typeof value === 'string') return value;
  return value instanceof URL ? value.href : value.url;
}

const user = { id: '1', username: 'player_1', displayName: 'Player One' };

it('keeps tokens out of renderer responses and sends them only to the configured API', async () => {
  let saved: string | null = null;
  const requests: string[] = [];

  const client = createSessionClient(
    'http://127.0.0.1:3001',
    {
      available: () => Promise.resolve(true),
      read: () => Promise.resolve(saved),
      write: async (value) => {
        await Promise.resolve();
        saved = value;
      },
      clear: async () => {
        await Promise.resolve();
        saved = null;
      },
    },
    async (url, init) => {
      await Promise.resolve();
      const address = addressOf(url);
      requests.push(address);
      if (address.endsWith('/auth/login'))
        return new Response(
          JSON.stringify({ token: 'a'.repeat(43), user, expiresAt: '2026-12-01T00:00:00Z' }),
        );
      expect(new Headers(init?.headers).get('authorization')).toBe(`Bearer ${'a'.repeat(43)}`);
      return new Response(JSON.stringify([user]));
    },
  );
  const result = await client.login({ username: 'player_1', password: 'password', remember: true });
  expect(result).toEqual({
    ok: true,
    value: { user, expiresAt: '2026-12-01T00:00:00Z', persistenceAvailable: true },
  });
  expect(saved).toBe('a'.repeat(43));
  expect(await client.listMembers()).toEqual({ ok: true, value: [user] });
  expect(requests).toEqual(['http://127.0.0.1:3001/auth/login', 'http://127.0.0.1:3001/members']);
});

it('rejects insecure remote endpoints and credentials in URLs', () => {
  expect(() => validateEndpoint('http://example.com', false)).toThrow();
  expect(() => validateEndpoint('https://user:pass@example.com', false)).toThrow();
  expect(() => validateEndpoint('http://127.0.0.1:3001', true)).toThrow();
  expect(validateEndpoint('https://example.com/', true)).toBe('https://example.com');
});

it('retains saved sessions after network failure, but clears unauthorized ones', async () => {
  let saved: string | null = 'a'.repeat(43);
  let status = 503;

  const client = createSessionClient(
    'https://example.com',
    {
      available: () => Promise.resolve(true),
      read: () => Promise.resolve(saved),
      write: async () => {},
      clear: async () => {
        await Promise.resolve();
        saved = null;
      },
    },
    () => Promise.resolve(new Response('{}', { status })),
  );
  expect((await client.restoreSession()).ok).toBe(false);
  expect(saved).not.toBeNull();
  status = 401;
  expect(await client.restoreSession()).toEqual({
    ok: true,
    value: { user: null, expiresAt: null, persistenceAvailable: true },
  });
  expect(saved).toBeNull();
});

it('does not persist without secure storage and clears memory even when logout fails', async () => {
  let wrote = false;
  let loggedOut = false;

  const client = createSessionClient(
    'https://example.com',
    {
      available: () => Promise.resolve(false),
      read: () => Promise.resolve(null),
      write: () => {
        wrote = true;
        return Promise.resolve();
      },
      clear: () => Promise.resolve(),
    },
    (url, init) => {
      if (addressOf(url).endsWith('/auth/login')) {
        expect(
          JSON.parse(typeof init?.body === 'string' ? init.body : '{}') as unknown,
        ).toMatchObject({ remember: false });

        return Promise.resolve(
          new Response(JSON.stringify({ token: 'a'.repeat(43), user, expiresAt: '2026-12-01' })),
        );
      }
      loggedOut = true;
      return Promise.reject(new Error('offline'));
    },
  );
  expect(
    (await client.login({ username: 'player_1', password: 'password', remember: true })).ok,
  ).toBe(true);
  expect(wrote).toBe(false);
  const result = await client.logout();
  expect(result.ok && result.value.warning).toContain('could not be confirmed');
  expect(loggedOut).toBe(true);
  expect(await client.listMembers()).toMatchObject({ ok: false, code: 'unauthorized' });
});

it('handles rate limits, malformed responses, invalid inputs and rejected fetches', async () => {
  let response: unknown = {};
  let status = 200;

  const store = {
    available: () => Promise.resolve(true),
    read: () => Promise.resolve(null),
    write: () => Promise.resolve(),
    clear: () => Promise.resolve(),
  };

  const client = createSessionClient('https://example.com', store, () =>
    Promise.resolve(new Response(JSON.stringify(response), { status })),
  );
  expect(await client.restoreSession()).toMatchObject({ ok: true, value: { user: null } });
  expect(await client.login({ username: '', password: '', remember: false })).toMatchObject({
    ok: false,
    code: 'invalid',
  });
  expect(
    await client.login({ username: 'player_1', password: 'password', remember: false }),
  ).toMatchObject({ ok: false, code: 'unavailable' });
  status = 429;
  expect(
    await client.login({ username: 'player_1', password: 'password', remember: false }),
  ).toMatchObject({ ok: false, code: 'rate-limit' });
  status = 401;
  expect(
    await client.login({ username: 'player_1', password: 'password', remember: false }),
  ).toMatchObject({ ok: false, code: 'unauthorized' });
  status = 200;
  response = { token: 'a'.repeat(43), user, expiresAt: '2026-12-01' };
  await client.login({ username: 'player_1', password: 'password', remember: false });
  response = [{ ...user, displayName: 4 }];
  expect(await client.listMembers()).toMatchObject({ ok: false, code: 'unavailable' });
  status = 401;
  expect(await client.listMembers()).toMatchObject({ ok: false, code: 'unauthorized' });
});

it('reports storage write failure while keeping the current session usable', async () => {
  const client = createSessionClient(
    'https://example.com',
    {
      available: () => Promise.resolve(true),
      read: () => Promise.resolve(null),
      write: () => Promise.reject(new Error('locked')),
      clear: () => Promise.resolve(),
    },
    () =>
      Promise.resolve(
        new Response(JSON.stringify({ token: 'a'.repeat(43), user, expiresAt: '2026-12-01' })),
      ),
  );
  const result = await client.login({ username: 'player_1', password: 'password', remember: true });
  expect(result.ok && result.value.warning).toContain('this session only');
});

it('restores valid sessions and rejects a reply without a usable deadline', async () => {
  let value: unknown = { user, expiresAt: '2026-12-01T00:00:00Z' };

  const client = createSessionClient(
    'https://example.com',
    {
      available: () => Promise.resolve(true),
      read: () => Promise.resolve('a'.repeat(43)),
      write: () => Promise.resolve(),
      clear: () => Promise.resolve(),
    },
    () => Promise.resolve(new Response(JSON.stringify(value))),
  );
  expect(await client.restoreSession()).toMatchObject({
    ok: true,
    value: { user, expiresAt: '2026-12-01T00:00:00Z' },
  });
  for (const malformed of [{}, user, { user }, { user, expiresAt: 'not a date' }]) {
    value = malformed;
    expect(await client.restoreSession()).toMatchObject({ ok: false, code: 'unavailable' });
  }
});

it('bounds every request with a timeout and refuses to follow redirects', async () => {
  const inits: RequestInit[] = [];

  const client = createSessionClient(
    'https://example.com',
    {
      available: () => Promise.resolve(false),
      read: () => Promise.resolve(null),
      write: () => Promise.resolve(),
      clear: () => Promise.resolve(),
    },
    async (_url, init) => {
      await Promise.resolve();
      inits.push(init ?? {});

      return new Response(
        JSON.stringify({ token: 'a'.repeat(43), user, expiresAt: '2026-12-01T00:00:00Z' }),
      );
    },
  );
  await client.login({ username: 'player_1', password: 'password', remember: false });
  expect(inits).toHaveLength(1);
  expect(inits[0]?.signal).toBeInstanceOf(AbortSignal);
  expect(inits[0]?.signal?.aborted).toBe(false);
  expect(inits[0]?.redirect).toBe('error');
});

it('keeps a stored token when the renderer asks for members before restoring', async () => {
  let saved: string | null = 'a'.repeat(43);

  const client = createSessionClient(
    'https://example.com',
    {
      available: () => Promise.resolve(true),
      read: () => Promise.resolve(saved),
      write: () => Promise.resolve(),
      clear: async () => {
        await Promise.resolve();
        saved = null;
      },
    },
    () => Promise.reject(new Error('the API must not be called')),
  );
  expect(await client.listMembers()).toMatchObject({ ok: false, code: 'unauthorized' });
  expect(saved).toBe('a'.repeat(43));
});

it('reports an unreadable local session as recoverable rather than as an outage', async () => {
  let cleared = false;

  const client = createSessionClient(
    'https://example.com',
    {
      available: () => Promise.resolve(true),
      read: () => Promise.reject(new Error('locked')),
      write: () => Promise.resolve(),
      clear: async () => {
        await Promise.resolve();
        cleared = true;
      },
    },
    () => Promise.reject(new Error('the API must not be called')),
  );
  const result = await client.restoreSession();
  expect(result).toMatchObject({ ok: false, code: 'unauthorized' });
  expect(result.ok ? '' : result.message).toContain('Sign in again');
  expect(cleared).toBe(true);
});
