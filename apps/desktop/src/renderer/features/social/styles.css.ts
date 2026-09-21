import { style } from '@vanilla-extract/css';
import { tokens as t } from '../../theme/tokens';

const compact = `screen and (max-width: ${t.breakpoint.compact})`;

export const shell = style({ display: 'flex', height: '100dvh', overflow: 'hidden' });

export const sidebar = style({
  width: t.size.sidebar,
  flexShrink: 0,
  background: t.color.surface,
  borderRight: `1px solid ${t.color.border}`,
  display: 'flex',
  flexDirection: 'column',
  padding: t.space.lg,
  '@media': {
    [compact]: {
      display: 'none',
      position: 'fixed',
      inset: '0 auto 0 0',
      zIndex: 20,
      width: 'min(290px, 90vw)',
    },
  },
});

export const sidebarOpen = style({ '@media': { [compact]: { display: 'flex' } } });

export const brand = style({
  padding: `${t.space.md}px ${t.space.sm}px ${t.space.xxl}px`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export const nav = style({
  display: 'grid',
  gap: t.space.xs,
  paddingBottom: t.space.xl,
  borderBottom: `1px solid ${t.color.border}`,
});

export const navItem = style({
  border: 0,
  borderRadius: t.radius.md,
  background: 'transparent',
  color: t.color.muted,
  minHeight: t.size.control,
  display: 'flex',
  alignItems: 'center',
  gap: t.space.md,
  padding: `${t.space.sm}px ${t.space.md}px`,
  textAlign: 'left',
  cursor: 'pointer',
  transition: `background ${t.motion.quick}, color ${t.motion.quick}`,
  ':hover': { background: t.color.hover, color: t.color.text },
});

export const active = style({ background: t.color.greenDim, color: t.color.green });

export const sidebarContent = style({ flex: 1, overflowY: 'auto', paddingTop: t.space.xl });

export const categoryHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: t.space.xs,
});

export const categoryToggle = style({
  border: 0,
  background: 'transparent',
  color: t.color.muted,
  fontWeight: 600,
  display: 'flex',
  gap: t.space.sm,
  alignItems: 'center',
  cursor: 'pointer',
  padding: t.space.sm,
  transition: `color ${t.motion.quick}`,
  ':hover': { color: t.color.text },
});

export const chevronOpen = style({ transform: 'rotate(90deg)' });

export const category = style({ marginBottom: t.space.lg });

export const add = style({
  opacity: 0,
  transition: `opacity ${t.motion.quick}`,
  selectors: {
    [`${categoryHeader}:hover &`]: { opacity: 1 },
    [`${categoryHeader}:focus-within &`]: { opacity: 1 },
  },
  '@media': { '(hover: none)': { opacity: 1 } },
});

export const channel = style([navItem, { width: '100%', minHeight: 36 }]);

export const emptyCategory = style({
  margin: `${t.space.sm}px ${t.space.md}px`,
  fontSize: t.type.small,
  color: t.color.subtle,
});

export const profile = style({
  display: 'flex',
  alignItems: 'center',
  gap: t.space.sm,
  paddingTop: t.space.lg,
  borderTop: `1px solid ${t.color.border}`,
});

export const profileText = style({ minWidth: 0, flex: 1 });

export const truncate = style({
  display: 'block',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
});

export const small = style({ fontSize: t.type.small, color: t.color.muted });

export const main = style({ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' });

export const header = style({
  minHeight: t.size.header,
  padding: `${t.space.lg}px ${t.space.xxl}px`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: t.space.lg,
  borderBottom: `1px solid ${t.color.border}`,
  '@media': { [compact]: { padding: t.space.lg } },
});

export const headerLeft = style({
  display: 'flex',
  alignItems: 'center',
  gap: t.space.md,
  minWidth: 0,
});

export const headerTitle = style({
  margin: 0,
  fontSize: t.type.lead,
  fontWeight: 600,
  letterSpacing: '-.02em',
});

export const preview = style({
  color: t.color.green,
  background: t.color.greenDim,
  borderRadius: t.radius.pill,
  padding: `${t.space.xs}px ${t.space.md}px`,
  fontSize: t.type.micro,
  whiteSpace: 'nowrap',
});

export const mobile = style({
  display: 'none',
  '@media': { [compact]: { display: 'inline-flex' } },
});

export const scrim = style({
  display: 'none',
  '@media': {
    [compact]: {
      display: 'block',
      position: 'fixed',
      inset: 0,
      zIndex: 19,
      background: t.color.overlay,
      border: 0,
    },
  },
});

export const scroll = style({
  overflowY: 'auto',
  flex: 1,
  padding: t.space.xxl,
  '@media': { [compact]: { padding: t.space.lg } },
});

export const home = style({
  maxWidth: t.size.maxContent,
  margin: '0 auto',
  padding: `${t.space.xl}px 0`,
});

export const greeting = style({ margin: 0, color: t.color.muted, fontSize: t.type.body });

export const title = style({
  margin: `${t.space.sm}px 0 ${t.space.lg}px`,
  fontSize: 'clamp(32px, 4vw, 48px)',
  lineHeight: 1.13,
  letterSpacing: '-.055em',
  fontWeight: 650,
  maxWidth: '18ch',
});

export const description = style({
  color: t.color.muted,
  margin: 0,
  maxWidth: '55ch',
  lineHeight: 1.7,
});

export const hero = style({
  marginTop: t.space.xxl,
  padding: t.space.xl,
  background: t.color.surface,
  border: `1px solid ${t.color.border}`,
  borderRadius: t.radius.lg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: t.space.xl,
});

export const heroHeading = style({
  margin: `0 0 ${t.space.xs}px`,
  fontSize: t.type.heading,
  letterSpacing: '-.035em',
});

export const heroMark = style({
  width: 56,
  height: 56,
  background: t.color.greenDim,
  color: t.color.green,
  borderRadius: t.radius.lg,
  display: 'grid',
  placeItems: 'center',
  fontSize: t.type.title,
  flexShrink: 0,
});

export const row = style({ display: 'flex', alignItems: 'center', gap: t.space.lg, minWidth: 0 });

export const section = style({ marginTop: t.space.hero });

export const sectionHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: t.space.lg,
  marginBottom: t.space.lg,
});

export const sectionTitle = style({ fontSize: t.type.lead, margin: 0, fontWeight: 600 });

export const members = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 245px), 1fr))',
  gap: t.space.sm,
});

export const member = style({
  display: 'flex',
  alignItems: 'center',
  gap: t.space.md,
  border: `1px solid ${t.color.border}`,
  borderRadius: t.radius.md,
  padding: t.space.lg,
  background: 'transparent',
  color: t.color.text,
  textAlign: 'left',
  cursor: 'pointer',
  transition: `background ${t.motion.quick}, border-color ${t.motion.quick}`,
  ':hover': { background: t.color.surface, borderColor: t.color.subtle },
});

export const note = style({
  color: t.color.subtle,
  fontSize: t.type.small,
  marginTop: t.space.xxl,
  display: 'flex',
  gap: t.space.sm,
  alignItems: 'center',
});

export const split = style({ display: 'flex', flex: 1, minHeight: 0 });

export const directList = style({
  width: t.size.sidebar,
  padding: t.space.lg,
  borderRight: `1px solid ${t.color.border}`,
  overflowY: 'auto',
  '@media': { [compact]: { width: '100%' } },
});

export const directHidden = style({ '@media': { [compact]: { display: 'none' } } });

export const input = style({
  width: '100%',
  background: t.color.canvas,
  border: `1px solid ${t.color.border}`,
  borderRadius: t.radius.md,
  color: t.color.text,
  padding: t.space.md,
  minHeight: t.size.control,
});

export const search = style({
  display: 'flex',
  alignItems: 'center',
  gap: t.space.sm,
  background: t.color.canvas,
  border: `1px solid ${t.color.border}`,
  borderRadius: t.radius.md,
  padding: `0 ${t.space.md}px`,
  minHeight: t.size.control,
  color: t.color.subtle,
  transition: `border-color ${t.motion.quick}`,
  ':focus-within': { outline: `2px solid ${t.color.green}`, outlineOffset: 2 },
});

export const searchInput = style({
  flex: 1,
  minWidth: 0,
  background: 'transparent',
  border: 0,
  outline: 'none',
  color: t.color.text,
  padding: `${t.space.md}px 0`,
});

export const friendList = style({ display: 'grid', gap: t.space.sm, marginTop: t.space.lg });

export const chat = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
});

export const empty = style({
  margin: 'auto',
  textAlign: 'center',
  maxWidth: 360,
  padding: t.space.xxl,
  color: t.color.muted,
});

export const emptySymbol = style({
  display: 'grid',
  placeItems: 'center',
  width: 64,
  height: 64,
  margin: `0 auto ${t.space.xl}px`,
  border: `1px solid ${t.color.border}`,
  borderRadius: t.radius.xl,
  color: t.color.green,
  fontSize: t.type.title,
});

export const messages = style({
  flex: 1,
  overflowY: 'auto',
  padding: t.space.xl,
  display: 'flex',
  flexDirection: 'column',
  gap: t.space.xl,
});

export const message = style({ display: 'flex', gap: t.space.md });

export const messageBody = style({ minWidth: 0 });

export const messageMeta = style({ display: 'flex', alignItems: 'baseline', gap: t.space.md });

export const messageText = style({
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  margin: `${t.space.xs}px 0 0`,
  color: t.color.text,
});

export const composerWrap = style({
  padding: `0 ${t.space.xl}px ${t.space.lg}px`,
  '@media': { [compact]: { padding: `0 ${t.space.lg}px ${t.space.lg}px` } },
});

export const composer = style({
  display: 'flex',
  alignItems: 'flex-end',
  gap: t.space.md,
  background: t.color.surface,
  border: `1px solid ${t.color.border}`,
  borderRadius: t.radius.lg,
  padding: t.space.md,
});

export const textarea = style({
  flex: 1,
  minWidth: 0,
  background: 'transparent',
  color: t.color.text,
  border: 0,
  resize: 'vertical',
  minHeight: t.size.control,
  maxHeight: 160,
  padding: t.space.sm,
});

export const composerHint = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: t.space.sm,
  color: t.color.subtle,
  fontSize: t.type.micro,
  margin: `${t.space.sm}px 0 0`,
});

export const field = style({ display: 'grid', gap: t.space.sm, marginBottom: t.space.lg });

export const formActions = style({
  display: 'flex',
  gap: t.space.sm,
  justifyContent: 'flex-end',
  marginTop: t.space.xl,
});

export const error = style({ color: t.color.danger, fontSize: t.type.small });
