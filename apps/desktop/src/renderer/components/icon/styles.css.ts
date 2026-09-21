import { style } from '@vanilla-extract/css';
import { tokens as t } from '../../theme/tokens';

export const icon = style({
  width: t.size.icon,
  height: t.size.icon,
  flexShrink: 0,
  transition: `transform ${t.motion.quick}`,
});
