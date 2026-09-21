import { expect, it } from 'vitest';
import { createLoginLimiter } from '../src/application/login-limiter.ts';

it('charges the budget only when a failure is reported and clears it on success', () => {
  const limiter = createLoginLimiter(() => 0);
  for (let attempt = 0; attempt < 50; attempt++) limiter.check('player_1', 'ip');
  expect(() => limiter.check('player_1', 'ip')).not.toThrow();
  for (let attempt = 0; attempt < 5; attempt++) limiter.fail('player_1', 'ip');
  expect(() => limiter.check('player_1', 'ip')).toThrow('Too many attempts');
  limiter.succeed('player_1');
  expect(() => limiter.check('player_1', 'ip')).not.toThrow();
});

it('keeps the username and address budgets independent', () => {
  const limiter = createLoginLimiter(() => 0);
  for (let attempt = 0; attempt < 30; attempt++) limiter.fail(`player_${attempt}`, 'shared');
  expect(() => limiter.check('untouched', 'shared')).toThrow('Too many attempts');
  expect(() => limiter.check('untouched', 'other')).not.toThrow();
});

it('evicts the oldest keys when full instead of locking out every account', () => {
  const limiter = createLoginLimiter(() => 0);
  for (let attempt = 0; attempt < 5; attempt++) limiter.fail('earliest', 'earliest-ip');
  expect(() => limiter.check('earliest', 'earliest-ip')).toThrow('Too many attempts');
  for (let attempt = 0; attempt < 12_000; attempt++)
    limiter.fail(`player_${attempt}`, `ip${attempt}`);
  expect(() => limiter.check('earliest', 'earliest-ip')).not.toThrow();
  for (let attempt = 0; attempt < 5; attempt++) limiter.fail('recent', 'recent-ip');
  expect(() => limiter.check('recent', 'recent-ip')).toThrow('Too many attempts');
  expect(() => limiter.check('newcomer', 'fresh-ip')).not.toThrow();
});

it('forgets a window once it has elapsed', () => {
  let now = 0;
  const limiter = createLoginLimiter(() => now);
  for (let attempt = 0; attempt < 5; attempt++) limiter.fail('player_1', 'ip');
  expect(() => limiter.check('player_1', 'ip')).toThrow('Too many attempts');
  now += 899_999;
  expect(() => limiter.check('player_1', 'ip')).toThrow('Too many attempts');
  now += 1;
  expect(() => limiter.check('player_1', 'ip')).not.toThrow();
});
