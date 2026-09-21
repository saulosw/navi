import { style } from '@vanilla-extract/css';
import { tokens as t } from '../../theme/tokens';

export const avatar = style({
  width: t.size.avatar,
  height: t.size.avatar,
  borderRadius: t.radius.md,
  display: 'grid',
  placeItems: 'center',
  background: t.color.greenDim,
  color: t.color.green,
  fontSize: t.type.small,
  fontWeight: 650,
  flexShrink: 0,
});
