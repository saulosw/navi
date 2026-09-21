import { style } from '@vanilla-extract/css';
import { tokens as t } from '../../theme/tokens';

export const overlay = style({
  position: 'fixed',
  inset: 0,
  background: t.color.overlay,
  zIndex: 30,
  display: 'grid',
  placeItems: 'center',
  padding: t.space.lg,
});

export const dialog = style({
  background: t.color.surface,
  border: `1px solid ${t.color.border}`,
  borderRadius: t.radius.lg,
  width: '100%',
  maxWidth: 440,
  maxHeight: '90dvh',
  overflowY: 'auto',
  padding: t.space.xl,
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: t.space.lg,
  marginBottom: t.space.xl,
});

export const title = style({ fontSize: t.type.heading, margin: 0, letterSpacing: '-.035em' });
