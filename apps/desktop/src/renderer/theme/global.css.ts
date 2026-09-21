import { globalStyle } from '@vanilla-extract/css';
import { tokens } from './tokens';

globalStyle('*', { boxSizing: 'border-box' });

globalStyle('body', {
  fontSize: tokens.type.body,
  lineHeight: 1.5,
  margin: 0,
  minWidth: 320,
  background: tokens.color.canvas,
  color: tokens.color.text,
  fontFamily: tokens.font,
});

globalStyle('::selection', { background: tokens.color.green, color: tokens.color.ink });

globalStyle(':focus-visible', { outline: `2px solid ${tokens.color.green}`, outlineOffset: 4 });

globalStyle('button, input, textarea, select', { font: 'inherit' });

globalStyle('button, a, input, textarea, select', { WebkitTapHighlightColor: 'transparent' });

globalStyle('button', { touchAction: 'manipulation' });

globalStyle('h1, h2, h3, p', { overflowWrap: 'anywhere' });

globalStyle(
  'button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible',
  { outlineOffset: 2 },
);

globalStyle('::placeholder', { color: tokens.color.subtle });

globalStyle('*', {
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      transitionDuration: '0.01ms !important',
      animationDuration: '0.01ms !important',
    },
  },
});
