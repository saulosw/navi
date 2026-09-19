// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { Brand } from '../src/renderer/components/brand/index';
afterEach(cleanup);
it('exposes the product name once to assistive technology', () => {
  render(<Brand />);
  expect(screen.getByText('navi')).toBeTruthy();
  // The decorative monogram repeats the initial and must stay out of the accessible name.
  expect(document.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
});
