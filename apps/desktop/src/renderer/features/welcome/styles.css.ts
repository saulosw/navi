import { style } from '@vanilla-extract/css';
import { tokens } from '../../theme/tokens';

export const page = style({
  minHeight: '100vh',
  maxWidth: 1400,
  margin: '0 auto',
  padding: '36px 56px',
  display: 'flex',
  flexDirection: 'column',
  '@media': { '(max-width: 760px)': { padding: 24 } },
});
export const header = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 24,
});
export const privateLabel = style({ color: tokens.color.muted, fontSize: 13 });
export const content = style({
  flex: 1,
  display: 'grid',
  gridTemplateColumns: '1.25fr 1fr',
  alignItems: 'center',
  gap: 72,
  padding: '64px 0',
  '@media': { '(max-width: 760px)': { gridTemplateColumns: '1fr', gap: 32, padding: '40px 0' } },
});
export const introduction = style({ maxWidth: 550 });
export const title = style({
  fontSize: 'clamp(40px, 5.6vw, 72px)',
  lineHeight: 1.04,
  letterSpacing: '-0.055em',
  fontWeight: 650,
  margin: '0 0 24px',
});
export const description = style({
  color: tokens.color.muted,
  fontSize: 18,
  lineHeight: 1.65,
  maxWidth: 390,
  margin: 0,
});
export const illustration = style({
  display: 'flex',
  gap: 12,
  marginTop: 40,
  alignItems: 'flex-start',
});
export const bubble = style({
  padding: '14px 24px',
  borderRadius: '20px 20px 20px 4px',
  background: tokens.color.green,
  color: tokens.color.ink,
  fontSize: 20,
  fontWeight: 600,
  transform: 'rotate(-5deg)',
});
export const reply = style({
  padding: '14px 24px',
  borderRadius: '20px 20px 4px 20px',
  border: `1px solid ${tokens.color.border}`,
  fontSize: 20,
  marginTop: 24,
  transform: 'rotate(3deg)',
});
export const panel = style({
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: 24,
  padding: 36,
  maxWidth: 400,
});
export const symbol = style({
  display: 'block',
  color: tokens.color.green,
  fontSize: 38,
  marginBottom: 32,
});
export const panelTitle = style({ fontSize: 26, margin: '0 0 16px', letterSpacing: '-0.025em' });
export const panelText = style({ color: tokens.color.muted, lineHeight: 1.7, margin: 0 });
export const note = style({
  margin: '28px 0 0',
  paddingTop: 24,
  borderTop: `1px solid ${tokens.color.border}`,
  fontSize: 13,
  color: tokens.color.muted,
  lineHeight: 1.6,
});
export const footer = style({ color: tokens.color.muted, fontSize: 12, paddingTop: 12 });
