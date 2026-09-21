import { expect, it, vi } from 'vitest';
import { provision } from '../src/adapters/cli/provision.ts';
import { createAuth } from '../src/application/auth.ts';
import { createMemoryAccounts } from './support/accounts.ts';

function setup(values: string[]) {
  const accounts = createMemoryAccounts();

  const auth = createAuth({
    accounts,
    passwords: {
      hash: (s) => Promise.resolve(`hash:${s}`),
      verify: (s, h) => Promise.resolve(h === `hash:${s}`),
    },
    tokens: { create: () => 'token', digest: (s) => s },
    clock: Date.now,
  });

  const ask = vi.fn<(label: string, secret?: boolean) => Promise<string>>(() =>
    Promise.resolve(values.shift() ?? ''),
  );
  return { accounts, auth, prompt: { ask } };
}

it('creates, resets and deactivates accounts using hidden password prompts', async () => {
  const values = ['player_1', 'Player One', 'long enough password', 'long enough password'];
  const { accounts, auth, prompt } = setup(values);
  await provision(auth, prompt, 'create');
  expect((await accounts.find('player_1'))?.displayName).toBe('Player One');
  expect(prompt.ask).toHaveBeenCalledWith('Password: ', true);
  values.push('player_1', 'another long password', 'another long password');
  await provision(auth, prompt, 'reset-password');
  expect((await accounts.find('player_1'))?.passwordHash).toBe('hash:another long password');
  values.push('player_1');
  await provision(auth, prompt, 'deactivate');
  expect((await accounts.find('player_1'))?.active).toBe(false);
});

it('does not write accounts when confirmation differs or the action is invalid', async () => {
  const { accounts, auth, prompt } = setup([
    'player_1',
    'Player One',
    'long enough password',
    'different',
  ]);
  await expect(provision(auth, prompt, 'create')).rejects.toThrow('Passwords do not match');
  expect(await accounts.list()).toEqual([]);
  await expect(provision(auth, prompt, 'unknown')).rejects.toThrow('Use create');
});
