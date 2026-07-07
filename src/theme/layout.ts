/** 8pt spacing grid, radii, and shadow tokens (PLAYBOOK 1.3 / 1.5). */
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/** Minimum touch target per PLAYBOOK 1.5 accessibility (>= 44px). */
export const HIT_TARGET = 44;

/** Layered low-opacity shadows, not heavy drops. */
export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 6,
  } satisfies ViewStyle,
  accentGlow: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 10,
  } satisfies ViewStyle,
} as const;
