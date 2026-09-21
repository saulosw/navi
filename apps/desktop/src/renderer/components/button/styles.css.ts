import { style, styleVariants } from '@vanilla-extract/css';
import { tokens as t } from '../../theme/tokens';

export const base = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: t.space.sm,
  minHeight: t.size.control,
  padding: `${t.space.sm}px ${t.space.lg}px`,
  border: '1px solid transparent',
  borderRadius: t.radius.md,
  font: 'inherit',
  fontWeight: 600,
  cursor: 'pointer',
  transition: `background ${t.motion.quick}, color ${t.motion.quick}, filter ${t.motion.quick}, opacity ${t.motion.quick}`,
  ':disabled': { opacity: 0.5, cursor: 'not-allowed' },
});

export const variant = styleVariants({
  primary: {
    background: t.color.green,
    color: t.color.ink,
    ':hover': { filter: 'brightness(1.05)' },
  },
  quiet: {
    background: 'transparent',
    color: t.color.muted,
    ':hover': { background: t.color.hover, color: t.color.text },
  },
  secondary: {
    background: t.color.raised,
    color: t.color.text,
    borderColor: t.color.border,
    ':hover': { background: t.color.hover },
  },
});
