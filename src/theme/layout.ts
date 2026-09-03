/**
 * 8pt spacing grid, radii, and shadow tokens.
 *
 * Radii are larger than the previous system and consistently so. Rounded forms are rated
 * as safer and more approachable than sharp ones (Bar & Neta) — sharp contours trigger a
 * measurable threat response. For an app someone opens mid-craving, that is worth the
 * few pixels.
 *
 * Shadows are near-absent. Panes here are translucent glass sitting on a lit sky; depth
 * comes from the light passing through them and from a top-edge highlight, not from a
 * drop shadow cast onto a surface that does not exist.
 */
import { ViewStyle } from 'react-native';
import { colors } from './colors';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Minimum touch target (>= 44px). Enforced on every interactive element. */
export const HIT_TARGET = 44;

export const shadow = {
  /** Barely-there lift. Panes read as glass, not as raised cards. */
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 2,
  } satisfies ViewStyle,
  /** Reserved for the hero numeral and the breathing orb. Nothing else glows. */
  accentGlow: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 8,
  } satisfies ViewStyle,
  /** Reward moments only — money, crossed milestones. */
  rewardGlow: {
    shadowColor: colors.reward,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 8,
  } satisfies ViewStyle,
} as const;
