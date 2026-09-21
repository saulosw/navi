import { style } from '@vanilla-extract/css';
import { tokens as t } from '../../theme/tokens';

export const center = style({
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: t.space.xl,
  padding: t.space.xl,
  textAlign: 'center',
});

export const notice = style({
  position: 'fixed',
  bottom: t.space.lg,
  right: t.space.lg,
  maxWidth: 'min(480px, calc(100vw - 32px))',
  background: t.color.raised,
  border: `1px solid ${t.color.border}`,
  borderRadius: t.radius.md,
  padding: t.space.lg,
  zIndex: 40,
  display: 'flex',
  alignItems: 'center',
  gap: t.space.lg,
});
