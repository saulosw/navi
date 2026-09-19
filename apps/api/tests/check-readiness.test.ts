import { expect, it } from 'vitest';
import { createReadinessCheck } from '../src/application/check-readiness.ts';

function countingProbe(outcome: () => void) {
  let calls = 0;
  return {
    probe: {
      check: () => {
        calls += 1;
        outcome();
        return Promise.resolve();
      },
    },
    calls: () => calls,
  };
}

it('reuses a recent result instead of querying the database again', async () => {
  let clock = 0;
  const { probe, calls } = countingProbe(() => {});
  const isReady = createReadinessCheck(probe, { ttlMs: 1000, now: () => clock });

  expect(await isReady()).toBe(true);
  expect(await isReady()).toBe(true);
  expect(calls()).toBe(1);

  clock = 1001;
  expect(await isReady()).toBe(true);
  expect(calls()).toBe(2);
});

it('collapses concurrent callers into a single probe', async () => {
  const { probe, calls } = countingProbe(() => {});
  const isReady = createReadinessCheck(probe, { now: () => 0 });

  expect(await Promise.all([isReady(), isReady(), isReady()])).toEqual([true, true, true]);
  expect(calls()).toBe(1);
});

it('caches an unavailable database and recovers after the window', async () => {
  let clock = 0;
  let healthy = false;
  const { probe, calls } = countingProbe(() => {
    if (!healthy) throw new Error('secret database URL');
  });
  const isReady = createReadinessCheck(probe, { ttlMs: 500, now: () => clock });

  expect(await isReady()).toBe(false);
  expect(await isReady()).toBe(false);
  expect(calls()).toBe(1);

  healthy = true;
  clock = 501;
  expect(await isReady()).toBe(true);
});
