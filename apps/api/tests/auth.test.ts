import { expect, it } from 'vitest';
import { createAuth } from '../src/application/auth.ts';
import { createMemoryAccounts } from './support/accounts.ts';

const password = 'a sufficiently long password';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function setup() {
  const accounts = createMemoryAccounts();
  let time = Date.parse('2026-01-01T00:00:00Z');
  let serial = 0;

  const auth = createAuth({
    accounts,
    clock: () => time,
    passwords: {
      hash: (value: string) => Promise.resolve(`hash:${value}`),
      verify: (value: string, hash: string) => Promise.resolve(hash === `hash:${value}`),
    },
    tokens: { create: () => `token-${++serial}`, digest: (value: string) => `digest:${value}` },
  });

  return {
    accounts,
    auth,
    advance: (ms: number) => {
      time += ms;
    },
  };
}

it('provisions normalized accounts and never returns credentials in profiles', async () => {
  const { auth } = setup();
  await auth.createUser('Player_1', 'Player One', password);
  const login = await auth.login('PLAYER_1', password, false, '127.0.0.1');
  expect(login.user).toEqual({ id: '1', username: 'player_1', displayName: 'Player One' });
  expect(await auth.members(login.token)).toEqual([login.user]);
  await expect(auth.createUser('player_1', 'Duplicate', password)).rejects.toThrow(
    'Username already exists',
  );
});

it('rejects invalid and inactive credentials identically and revokes reset sessions', async () => {
  const { auth } = setup();
  await auth.createUser('player_1', 'Player One', password);
  await expect(auth.login('missing', password, false, 'a')).rejects.toThrow(
    'Invalid username or password',
  );
  await expect(auth.login('player_1', 'wrong', false, 'a')).rejects.toThrow(
    'Invalid username or password',
  );
  const first = await auth.login('player_1', password, false, 'a');
  await auth.resetPassword('player_1', 'another sufficiently long password');
  await expect(auth.session(first.token)).rejects.toThrow('Session expired');
  const second = await auth.login('player_1', 'another sufficiently long password', false, 'b');
  await auth.deactivate('player_1');
  await expect(auth.session(second.token)).rejects.toThrow('Session expired');
  await expect(auth.login('player_1', password, false, 'b')).rejects.toThrow(
    'Invalid username or password',
  );
});

it('expires sessions at their deadline and revokes logout immediately', async () => {
  const { auth, advance } = setup();
  await auth.createUser('player_1', 'Player One', password);
  const short = await auth.login('player_1', password, false, 'a');
  const long = await auth.login('player_1', password, true, 'a');
  advance(12 * 3600_000);
  await expect(auth.session(short.token)).rejects.toThrow('Session expired');
  expect((await auth.session(long.token)).user.username).toBe('player_1');
  expect((await auth.session(long.token)).expiresAt).toBe(long.expiresAt);
  await auth.logout(long.token);
  await expect(auth.session(long.token)).rejects.toThrow('Session expired');
  const persisted = await auth.login('player_1', password, true, 'a');
  advance(30 * 86400_000);
  await expect(auth.session(persisted.token)).rejects.toThrow('Session expired');
});

it('locks a username after five failures and releases it after 15 minutes', async () => {
  const { auth, advance } = setup();
  await auth.createUser('player_1', 'Player One', password);
  for (let attempt = 0; attempt < 5; attempt++)
    await expect(auth.login('Player_1', 'wrong', false, `ip${attempt}`)).rejects.toThrow(
      'Invalid username or password',
    );
  await expect(auth.login('player_1', password, false, 'other')).rejects.toThrow(
    'Too many attempts',
  );
  advance(900_000);
  await expect(auth.login('player_1', password, false, 'other')).resolves.toMatchObject({
    user: { username: 'player_1' },
  });
});

it('charges the attempt budget to failures only and clears it on a success', async () => {
  const { auth } = setup();
  await auth.createUser('player_1', 'Player One', password);
  for (let attempt = 0; attempt < 6; attempt++)
    await expect(auth.login('player_1', password, false, 'ip')).resolves.toMatchObject({
      user: { username: 'player_1' },
    });
  for (let attempt = 0; attempt < 4; attempt++)
    await expect(auth.login('player_1', 'wrong', false, 'ip')).rejects.toThrow(
      'Invalid username or password',
    );
  await auth.login('player_1', password, false, 'ip');
  for (let attempt = 0; attempt < 4; attempt++)
    await expect(auth.login('player_1', 'wrong', false, 'ip')).rejects.toThrow(
      'Invalid username or password',
    );
  await expect(auth.login('player_1', password, false, 'ip')).resolves.toMatchObject({
    user: { username: 'player_1' },
  });
});

it('limits attempts across usernames from one IP', async () => {
  const { auth } = setup();
  for (let attempt = 0; attempt < 30; attempt++)
    await expect(auth.login(`player_${attempt}`, password, false, 'shared')).rejects.toThrow(
      'Invalid username or password',
    );
  await expect(auth.login('another', password, false, 'shared')).rejects.toThrow(
    'Too many attempts',
  );
});

it('rejects weak provisioning passwords and blank display names', async () => {
  const { auth } = setup();
  await expect(auth.createUser('player_1', 'Player One', 'short')).rejects.toThrow(
    '15–128 characters',
  );
  await expect(auth.createUser('player_1', ' ', password)).rejects.toThrow('1–80 characters');
  await expect(auth.createUser('no', 'Player One', password)).rejects.toThrow(
    '3–32 lowercase letters',
  );
});

it('reports an unknown account for administrative updates', async () => {
  const { auth } = setup();
  await expect(auth.resetPassword('missing', password)).rejects.toThrow('User not found');
  await expect(auth.deactivate('missing')).rejects.toThrow('User not found');
});

it('serializes password derivations and refuses to queue beyond the bound', async () => {
  const { accounts } = setup();
  let active = 0;
  let peak = 0;
  const pending: Array<(valid: boolean) => void> = [];

  const auth = createAuth({
    accounts,
    clock: Date.now,
    tokens: { create: () => 'token', digest: (value) => value },
    passwords: {
      hash: (value) => Promise.resolve(`hash:${value}`),
      verify: () => {
        active++;
        peak = Math.max(peak, active);

        return new Promise<boolean>((resolve) => {
          pending.push((valid) => {
            active--;
            resolve(valid);
          });
        });
      },
    },
  });

  const attempts = Array.from({ length: 8 }, (_, index) =>
    auth.login(`player_${index}`, password, false, `ip${index}`).catch((error) => error as Error),
  );
  await flush();
  expect(pending).toHaveLength(1);
  await expect(auth.login('late', password, false, 'ip-late')).rejects.toThrow('Too many attempts');
  while (pending.length) {
    pending.shift()?.(false);
    await flush();
  }
  expect(peak).toBe(1);
  for (const settled of await Promise.all(attempts))
    expect(settled).toMatchObject({ message: 'Invalid username or password' });
});

it('does not cache a failed dummy derivation across logins', async () => {
  const { accounts } = setup();
  let hashes = 0;

  const auth = createAuth({
    accounts,
    clock: Date.now,
    tokens: { create: () => 'token', digest: (value) => value },
    passwords: {
      hash: () =>
        ++hashes === 1 ? Promise.reject(new Error('out of memory')) : Promise.resolve('hash'),
      verify: () => Promise.resolve(false),
    },
  });
  await expect(auth.login('missing', password, false, 'ip')).rejects.toThrow('out of memory');
  await expect(auth.login('missing', password, false, 'ip')).rejects.toThrow(
    'Invalid username or password',
  );
  expect(hashes).toBe(2);
});

it('rejects an old password login that completes after an administrative reset', async () => {
  const { accounts } = setup();
  await accounts.create('player_1', 'Player One', 'old hash');

  let release: (valid: boolean) => void = () => {};

  const verifying = new Promise<boolean>((resolve) => {
    release = resolve;
  });

  const auth = createAuth({
    accounts,
    clock: Date.now,
    tokens: { create: () => 'token', digest: (value) => value },
    passwords: { hash: () => Promise.resolve('new hash'), verify: () => verifying },
  });
  const login = auth.login('player_1', password, false, 'ip');
  await flush();
  await auth.resetPassword('player_1', password);
  release(true);
  await expect(login).rejects.toThrow('Invalid username or password');
});
