import { style } from '@vanilla-extract/css';
import { tokens as t } from '../../theme/tokens';

export const page = style({
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  padding: t.space.xxl,
  maxWidth: 1320,
  margin: 'auto',
  '@media': { '(max-width: 760px)': { padding: t.space.xl } },
});

export const header = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: t.space.lg,
});

export const small = style({ color: t.color.muted, fontSize: t.type.small });

export const layout = style({
  display: 'grid',
  gridTemplateColumns: '1.15fr 1fr',
  alignItems: 'center',
  flex: 1,
  gap: t.space.hero,
  padding: `${t.space.hero}px 0`,
  '@media': { '(max-width: 760px)': { gridTemplateColumns: '1fr', gap: t.space.xxl } },
});

export const title = style({
  fontSize: 'clamp(40px, 5.5vw, 72px)',
  lineHeight: 1.06,
  letterSpacing: '-.06em',
  fontWeight: 650,
  margin: `0 0 ${t.space.xl}px`,
  maxWidth: '12ch',
});

export const intro = style({
  color: t.color.muted,
  fontSize: t.type.lead,
  maxWidth: '35ch',
  lineHeight: 1.7,
});

export const conversation = style({
  display: 'flex',
  gap: t.space.md,
  alignItems: 'flex-start',
  marginTop: t.space.xxl,
});

export const bubble = style({
  padding: `${t.space.md}px ${t.space.xl}px`,
  borderRadius: `${t.radius.lg}px ${t.radius.lg}px ${t.radius.lg}px ${t.space.xs}px`,
  background: t.color.green,
  color: t.color.ink,
  fontWeight: 600,
});

export const reply = style({
  padding: `${t.space.md}px ${t.space.xl}px`,
  marginTop: t.space.xl,
  borderRadius: `${t.radius.lg}px ${t.radius.lg}px ${t.space.xs}px ${t.radius.lg}px`,
  border: `1px solid ${t.color.border}`,
  color: t.color.text,
});

export const card = style({
  background: t.color.surface,
  border: `1px solid ${t.color.border}`,
  borderRadius: t.radius.xl,
  padding: t.space.xxl,
  width: '100%',
  maxWidth: 440,
  justifySelf: 'end',
  '@media': {
    '(max-width: 760px)': { maxWidth: '100%' },
    '(max-width: 480px)': { padding: t.space.xl },
  },
});

export const heading = style({
  fontSize: t.type.heading,
  letterSpacing: '-.035em',
  margin: `0 0 ${t.space.sm}px`,
});

export const description = style({
  color: t.color.muted,
  margin: `0 0 ${t.space.xl}px`,
  fontSize: t.type.small,
});

export const field = style({
  display: 'grid',
  gap: t.space.sm,
  marginBottom: t.space.lg,
  fontWeight: 500,
});

export const input = style({
  width: '100%',
  minWidth: 0,
  background: t.color.canvas,
  color: t.color.text,
  border: `1px solid ${t.color.border}`,
  borderRadius: t.radius.md,
  padding: t.space.md,
  minHeight: t.size.control,
  transition: `border-color ${t.motion.quick}`,
  ':focus': { borderColor: t.color.subtle },
});

export const password = style({ display: 'flex', gap: t.space.sm });

export const checkbox = style({
  display: 'flex',
  alignItems: 'center',
  gap: t.space.sm,
  margin: `${t.space.xl}px 0`,
  fontSize: t.type.small,
  color: t.color.muted,
});

export const check = style({ accentColor: t.color.green, width: t.size.icon, height: t.size.icon });

export const submit = style({ width: '100%' });

export const help = style({
  margin: `${t.space.xl}px 0 0`,
  textAlign: 'center',
  color: t.color.muted,
  fontSize: t.type.small,
});

export const error = style({ color: t.color.danger, fontSize: t.type.small });

export const footer = style({
  color: t.color.subtle,
  fontSize: t.type.small,
  display: 'flex',
  gap: t.space.sm,
  alignItems: 'center',
});
