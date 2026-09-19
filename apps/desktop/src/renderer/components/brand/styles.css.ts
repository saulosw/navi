import { style } from '@vanilla-extract/css';
import { tokens } from '../../theme/tokens';

export const brand = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 12,
  fontSize: 28,
  fontWeight: 700,
  letterSpacing: '-0.06em',
});
export const mark = style({
  display: 'grid',
  placeItems: 'center',
  width: 36,
  height: 36,
  borderRadius: '12px 12px 12px 3px',
  background: tokens.color.green,
  color: tokens.color.ink,
  fontSize: 28,
});
