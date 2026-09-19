import { globalStyle } from '@vanilla-extract/css';
import { tokens } from './tokens';

globalStyle('*', { boxSizing: 'border-box' });
globalStyle('body', {
  margin: 0,
  minWidth: 320,
  background: tokens.color.canvas,
  color: tokens.color.text,
  fontFamily: tokens.font,
});
globalStyle('::selection', { background: tokens.color.green, color: tokens.color.ink });
globalStyle(':focus-visible', { outline: `2px solid ${tokens.color.green}`, outlineOffset: 4 });
