// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { Login } from '../src/renderer/features/login';

afterEach(cleanup);

function renderLogin(overrides: Partial<ComponentProps<typeof Login>> = {}) {
  const onLogin = vi.fn();
  render(<Login available pending={false} error="" onLogin={onLogin} {...overrides} />);

  return onLogin;
}

const passwordField = () => screen.getByLabelText<HTMLInputElement>('Password');

it('reveals and hides the password without submitting the form', () => {
  const onLogin = renderLogin();
  expect(passwordField().type).toBe('password');

  fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
  expect(passwordField().type).toBe('text');
  expect(screen.getByRole('button', { name: 'Hide password' }).getAttribute('aria-pressed')).toBe(
    'true',
  );

  fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
  expect(passwordField().type).toBe('password');
  expect(onLogin).not.toHaveBeenCalled();
});

it('submits a trimmed username and honours the remember choice', () => {
  const onLogin = renderLogin();
  fireEvent.change(screen.getByLabelText('Username'), { target: { value: '  Player_1  ' } });
  fireEvent.change(passwordField(), { target: { value: 'a sufficiently long password' } });
  fireEvent.click(screen.getByLabelText('Keep me signed in'));
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

  expect(onLogin).toHaveBeenCalledWith({
    username: 'Player_1',
    password: 'a sufficiently long password',
    remember: true,
  });
});

it('never asks to be remembered when secure storage is unavailable', () => {
  const onLogin = renderLogin({ available: false });
  expect(screen.getByLabelText<HTMLInputElement>('Keep me signed in').disabled).toBe(true);
  expect(screen.getByText(/Secure storage is unavailable/)).toBeTruthy();

  fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'player_1' } });
  fireEvent.change(passwordField(), { target: { value: 'a sufficiently long password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(onLogin).toHaveBeenCalledWith(expect.objectContaining({ remember: false }));
});

it('refuses a second submission while a sign-in is already in flight', () => {
  const onLogin = renderLogin({ pending: true });
  expect(screen.getByRole<HTMLButtonElement>('button', { name: /Signing in/ }).disabled).toBe(true);
  expect(screen.getByLabelText<HTMLInputElement>('Username').disabled).toBe(true);

  const form = screen.getByLabelText('Username').closest('form');
  fireEvent.submit(form!);
  expect(onLogin).not.toHaveBeenCalled();
});

it('announces a rejected sign-in to assistive technology', () => {
  renderLogin({ error: 'Invalid username or password' });
  expect(screen.getByRole('alert').textContent).toBe('Invalid username or password');
});
