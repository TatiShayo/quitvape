/** Theme barrel. Import tokens from '@/theme'. */
import { colors } from './colors';
import { typography } from './typography';
import { spacing, radii, shadow, HIT_TARGET } from './layout';
import { duration, spring, PRESS_SCALE } from './motion';

export { colors } from './colors';
export type { ColorToken } from './colors';
export { typography, fontFamily, tabularNums } from './typography';
export type { TypographyToken } from './typography';
export { spacing, radii, shadow, HIT_TARGET } from './layout';
export { duration, spring, PRESS_SCALE } from './motion';
export { fontMap } from './fonts';
export { skyAt, skyProgress, mixHex, PANIC_SKY } from './sky';
export type { SkyStops } from './sky';

export const theme = {
  colors,
  typography,
  spacing,
  radii,
  shadow,
  duration,
  spring,
  HIT_TARGET,
  PRESS_SCALE,
} as const;

export type Theme = typeof theme;
