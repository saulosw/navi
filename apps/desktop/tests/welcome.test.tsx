// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { Welcome } from '../src/renderer/features/welcome/index';
afterEach(cleanup);
it('introduces the private space without pretending authentication exists', () => {
  render(<Welcome />);
  expect(screen.getByRole('heading', { name: 'Our place to hang out.' })).toBeTruthy();
  expect(screen.getByText(/access is being prepared/i)).toBeTruthy();
  expect(screen.queryByRole('button', { name: /sign in|sign up/i })).toBeNull();
});
