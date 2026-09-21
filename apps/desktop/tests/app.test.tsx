// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { DesktopBridge } from '@navi/contracts';
import { App } from '../src/renderer/features/app';

const user = { id: '1', username: 'player_1', displayName: 'Player One' };

const inAnHour = () => new Date(Date.now() + 3600_000).toISOString();

function bridge(): DesktopBridge {
  return {
    platform: 'linux',
    restoreSession: () =>
      Promise.resolve({
        ok: true,
        value: { user: null, expiresAt: null, persistenceAvailable: true },
      }),
    login: () =>
      Promise.resolve({
        ok: true,
        value: { user, expiresAt: inAnHour(), persistenceAvailable: true },
      }),
    listMembers: () => Promise.resolve({ ok: true, value: [user] }),
    logout: () => Promise.resolve({ ok: true, value: {} }),
  };
}

async function signIn(api: DesktopBridge) {
  render(<App bridge={api} />);
  await screen.findByLabelText('Username');
  fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'player_1' } });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'a sufficiently long password' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  await screen.findByRole('button', { name: 'Open general' });
}

afterEach(cleanup);

it('signs in with the bridge and clears the preview on logout', async () => {
  await signIn(bridge());
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  await screen.findByLabelText('Username');
  expect(screen.queryByText('Local preview')).toBeNull();
});

it('offers a retry after restoration failure without showing private content', async () => {
  const api = bridge();
  let attempts = 0;
  api.restoreSession = () =>
    Promise.resolve(
      ++attempts === 1
        ? { ok: false, code: 'unavailable', message: 'Network unavailable' }
        : { ok: true, value: { user: null, expiresAt: null, persistenceAvailable: false } },
    );
  render(<App bridge={api} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
  await screen.findByLabelText('Username');
  expect(screen.getByLabelText<HTMLInputElement>('Keep me signed in').disabled).toBe(true);
});

it('does not pretend to log in when preload is absent', async () => {
  render(<App />);
  await waitFor(() =>
    expect(screen.getByRole('alert').textContent).toContain('desktop connection'),
  );
});

it('ignores a member refresh that completes after logout', async () => {
  const api = bridge();
  api.restoreSession = () =>
    Promise.resolve({
      ok: true,
      value: { user, expiresAt: inAnHour(), persistenceAvailable: true },
    });
  render(<App bridge={api} />);
  await screen.findByRole('button', { name: 'Refresh members' });

  let complete: (value: Awaited<ReturnType<DesktopBridge['listMembers']>>) => void = () => {};

  api.listMembers = () =>
    new Promise((resolve) => {
      complete = resolve;
    });
  fireEvent.click(screen.getByRole('button', { name: 'Refresh members' }));
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  await screen.findByLabelText('Username');
  await act(async () => {
    complete({ ok: true, value: [user] });
    await Promise.resolve();
  });
  await waitFor(() => expect(screen.getByLabelText('Username')).toBeTruthy());
});

it('sends an unreadable stored session to the form instead of a retry screen', async () => {
  const api = bridge();
  api.restoreSession = () =>
    Promise.resolve({
      ok: false,
      code: 'unauthorized',
      message: 'Your saved session could not be read. Sign in again.',
    });
  render(<App bridge={api} />);
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'Your saved session could not be read. Sign in again.',
  );
  expect(screen.getByLabelText('Username')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
});

it('does not offer to sign out when no session was ever established', async () => {
  const api = bridge();
  api.restoreSession = () =>
    Promise.resolve({ ok: false, code: 'unavailable', message: 'Network unavailable' });
  render(<App bridge={api} />);
  await screen.findByRole('button', { name: 'Try again' });
  expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull();
});

it('returns to the form when the session deadline passes', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  try {
    const api = bridge();
    api.login = () =>
      Promise.resolve({
        ok: true,
        value: {
          user,
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
          persistenceAvailable: true,
        },
      });
    await signIn(api);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(screen.getByRole('alert').textContent).toBe('Your session expired. Sign in again.');
    expect(screen.getByLabelText('Username')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Open general' })).toBeNull();
  } finally {
    vi.useRealTimers();
  }
});

it('keeps a remembered session alive past the longest timer a browser accepts', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  try {
    const api = bridge();
    const thirtyDays = 30 * 86_400_000;
    const longestDelay = 2_147_483_647;
    api.login = () =>
      Promise.resolve({
        ok: true,
        value: {
          user,
          expiresAt: new Date(Date.now() + thirtyDays).toISOString(),
          persistenceAvailable: true,
        },
      });
    await signIn(api);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(longestDelay);
    });
    expect(screen.getByRole('button', { name: 'Open general' })).toBeTruthy();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(thirtyDays - longestDelay);
    });
    expect(screen.getByLabelText('Username')).toBeTruthy();
  } finally {
    vi.useRealTimers();
  }
});

it('warns about a failed refresh without ending the session, then dismisses the notice', async () => {
  const api = bridge();
  await signIn(api);
  api.listMembers = () =>
    Promise.resolve({ ok: false, code: 'unavailable', message: 'Cannot reach Navi.' });
  fireEvent.click(screen.getByRole('button', { name: 'Refresh members' }));
  await screen.findByText('Could not refresh your crew. Try again.');
  expect(screen.getByRole('button', { name: 'Open general' })).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
  expect(screen.queryByText('Could not refresh your crew. Try again.')).toBeNull();
});

it('returns to the form when a refresh finds the session gone', async () => {
  const api = bridge();
  await signIn(api);
  api.listMembers = () =>
    Promise.resolve({ ok: false, code: 'unauthorized', message: 'Sign in again.' });
  fireEvent.click(screen.getByRole('button', { name: 'Refresh members' }));
  await screen.findByLabelText('Username');
  expect(screen.getByRole('alert').textContent).toBe('Sign in again.');
});

it('surfaces a logout warning reported by the bridge', async () => {
  const api = bridge();
  api.logout = () =>
    Promise.resolve({
      ok: true,
      value: { warning: 'Local session storage could not be removed.' },
    });
  await signIn(api);
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  expect(await screen.findByText('Local session storage could not be removed.')).toBeTruthy();
});

it('reports rejected credentials, clears the password and allows another attempt', async () => {
  const api = bridge();
  api.login = () =>
    Promise.resolve({ ok: false, code: 'unauthorized', message: 'Invalid username or password' });
  render(<App bridge={api} />);
  await screen.findByLabelText('Username');
  fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'player_1' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

  await screen.findByText('Invalid username or password');
  expect(screen.getByLabelText<HTMLInputElement>('Password').value).toBe('');
  expect(screen.getByLabelText<HTMLInputElement>('Username').value).toBe('player_1');
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Sign in' }).disabled).toBe(false);
});

it('recovers when the bridge itself throws during sign in', async () => {
  const api = bridge();
  api.login = () => Promise.reject(new Error('bridge crashed'));
  render(<App bridge={api} />);
  await screen.findByLabelText('Username');
  fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'player_1' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'a long password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

  expect(await screen.findByText('Cannot sign in. Try again.')).toBeTruthy();
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Sign in' }).disabled).toBe(false);
});

it('signs out locally even when the bridge throws', async () => {
  const api = bridge();
  await signIn(api);
  api.logout = () => Promise.reject(new Error('bridge crashed'));
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

  await screen.findByLabelText('Username');
  expect(
    await screen.findByText('Signed out here. Server session revocation could not be confirmed.'),
  ).toBeTruthy();
});

it('offers to retry or sign out when the crew cannot be loaded for a live session', async () => {
  const api = bridge();
  let attempts = 0;
  api.restoreSession = () =>
    Promise.resolve({
      ok: true,
      value: { user, expiresAt: inAnHour(), persistenceAvailable: true },
    });
  api.listMembers = () =>
    ++attempts === 1
      ? Promise.reject(new Error('offline'))
      : Promise.resolve({ ok: true, value: [user] });
  render(<App bridge={api} />);

  expect((await screen.findByRole('alert')).textContent).toBe(
    'Could not load your crew. Try again.',
  );
  expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  await screen.findByRole('button', { name: 'Open general' });
});
