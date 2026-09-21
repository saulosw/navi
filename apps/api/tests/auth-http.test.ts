import { expect, it } from 'vitest';
import { buildApp } from '../src/main/build-app.ts';
import { createAuth } from '../src/application/auth.ts';
import { createMemoryAccounts } from './support/accounts.ts';
import { randomBytes, scrypt } from 'node:crypto';
import { passwordHasher, tokenService } from '../src/infrastructure/security/crypto.ts';

it('authenticates through HTTP, protects members and invalidates logout', async () => {
  const auth = createAuth({
    accounts: createMemoryAccounts(),
    passwords: passwordHasher,
    tokens: tokenService,
    clock: Date.now,
  });
  await auth.createUser('player_1', 'Player One', 'a sufficiently long password');
  const app = buildApp({ check: async () => {} }, undefined, auth);
  try {
    expect((await app.inject('/members')).statusCode).toBe(401);
    expect(
      (await app.inject({ method: 'POST', url: '/auth/login', payload: { username: 1 } }))
        .statusCode,
    ).toBe(400);

    const login = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { username: 'player_1', password: 'a sufficiently long password', remember: false },
    });
    expect(login.statusCode).toBe(200);
    const { token } = login.json<{ token: string }>();
    const headers = { authorization: `Bearer ${token}` };
    expect((await app.inject({ url: '/auth/session', headers })).statusCode).toBe(200);
    const members = await app.inject({ url: '/members', headers });
    expect(members.json()).toEqual([{ id: '1', username: 'player_1', displayName: 'Player One' }]);
    expect(members.headers['cache-control']).toBe('no-store');
    for (const authorization of [token, `Bearer ${token}x`, `Bearer ${token.slice(1)}`, 'Bearer '])
      expect(
        (await app.inject({ url: '/auth/session', headers: { authorization } })).statusCode,
      ).toBe(401);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/auth/login',
          payload: '<login/>',
          headers: { 'content-type': 'application/xml' },
        })
      ).statusCode,
    ).toBe(415);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/auth/login',
          payload: JSON.stringify({ username: 'x'.repeat(2_000_000) }),
          headers: { 'content-type': 'application/json' },
        })
      ).statusCode,
    ).toBe(413);
    expect((await app.inject({ method: 'POST', url: '/auth/logout', headers })).statusCode).toBe(
      204,
    );
    expect((await app.inject({ url: '/members', headers })).statusCode).toBe(401);
  } finally {
    await app.close();
  }
});

it('hashes with independent salts and rejects wrong passwords and malformed hashes', async () => {
  const hash = await passwordHasher.hash('a sufficiently long password');
  expect(hash).not.toContain('sufficiently');
  expect(await passwordHasher.verify('a sufficiently long password', hash)).toBe(true);
  expect(await passwordHasher.verify('wrong', hash)).toBe(false);
  expect(await passwordHasher.verify('anything', 'broken')).toBe(false);
  expect(await passwordHasher.hash('a sufficiently long password')).not.toBe(hash);
});

it('records the derivation cost in the hash and keeps it at the documented minimum', async () => {
  const [scheme, cost] = (await passwordHasher.hash('a sufficiently long password')).split('$');
  expect(scheme).toBe('scrypt');

  const { N, r, p } = Object.fromEntries(cost!.split(',').map((pair) => pair.split('='))) as Record<
    string,
    string
  >;
  expect(Number(N)).toBeGreaterThanOrEqual(131072);
  expect(Number(r)).toBeGreaterThanOrEqual(8);
  expect(Number(p)).toBeGreaterThanOrEqual(1);
});

it('verifies hashes written under an older cost so the work factor can be raised', async () => {
  const salt = randomBytes(16);
  const key = await new Promise<Buffer>((resolve, reject) =>
    scrypt('legacy password', salt, 64, { N: 16384, r: 8, p: 1 }, (error, derived) =>
      error ? reject(error) : resolve(derived),
    ),
  );
  const legacy = `scrypt$N=16384,r=8,p=1$${salt.toString('base64url')}$${key.toString('base64url')}`;

  expect(await passwordHasher.verify('legacy password', legacy)).toBe(true);
  expect(await passwordHasher.verify('wrong', legacy)).toBe(false);
});

it('refuses hashes whose recorded cost is unusable', async () => {
  const salt = randomBytes(16).toString('base64url');
  const key = randomBytes(64).toString('base64url');

  for (const cost of ['N=3,r=8,p=1', 'N=1048576,r=8,p=1', 'N=16384,r=8,p=0'])
    expect(await passwordHasher.verify('anything', `scrypt$${cost}$${salt}$${key}`)).toBe(false);
});

it('issues unpredictable session tokens with a stable digest', () => {
  const issued = new Set(Array.from({ length: 100 }, () => tokenService.create()));
  expect(issued.size).toBe(100);
  for (const token of issued) expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(tokenService.digest('token')).toHaveLength(64);
  expect(tokenService.digest('token')).toBe(tokenService.digest('token'));
  expect(tokenService.digest('token')).not.toBe(tokenService.digest('other'));
});

it('rejects a malformed bearer token before it reaches the account store', async () => {
  const calls: string[] = [];

  const app = buildApp({ check: () => Promise.resolve() }, undefined, {
    session: (token: string) => {
      calls.push(token);
      return Promise.reject(new Error('the store must not be consulted'));
    },
  } as unknown as Parameters<typeof buildApp>[2]);
  try {
    for (const authorization of [
      `Bearer ${'a'.repeat(42)}`,
      `Bearer ${'a'.repeat(44)}`,
      `Bearer ${'a'.repeat(43)} extra`,
      `bearer ${'a'.repeat(43)}`,
      `Bearer ${'!'.repeat(43)}`,
      'Bearer ',
      'a'.repeat(43),
    ])
      expect(
        (await app.inject({ url: '/auth/session', headers: { authorization } })).statusCode,
      ).toBe(401);
    expect(calls).toEqual([]);
    expect(
      (
        await app.inject({
          url: '/auth/session',
          headers: { authorization: `Bearer ${'a'.repeat(43)}` },
        })
      ).statusCode,
    ).toBe(500);
    expect(calls).toEqual(['a'.repeat(43)]);
  } finally {
    await app.close();
  }
});
