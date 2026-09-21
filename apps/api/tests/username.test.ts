import { expect, it } from 'vitest';
import { parseUsername } from '../src/domain/users/username.ts';

it('normalizes a username for unique storage', () => {
  expect(parseUsername('  Player_1  ')).toBe('player_1');
});

it.each(['', 'ab', 'x'.repeat(33), 'user name', 'a@b', 'pláyer'])(
  'rejects invalid username %s',
  (input) => {
    expect(() => parseUsername(input)).toThrow('3–32 lowercase letters');
  },
);
