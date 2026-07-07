/**
 * Typography tokens. Space Grotesk (display) + Inter (body), self-hosted via
 * @expo-google-fonts. All stats/timers/money use tabular numerals (PLAYBOOK 1.2).
 * Font family keys must match the names loaded in src/theme/fonts.ts.
 */
import { TextStyle } from 'react-native';

export const fontFamily = {
  display: 'SpaceGrotesk_700Bold',
  displayMedium: 'SpaceGrotesk_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
} as const;

/** Applied to any numeric display (streak, money, timers) for tabular alignment. */
export const tabularNums: TextStyle = {
  fontVariant: ['tabular-nums'],
};

export const typography = {
  // Display — big, tight tracking. The streak counter is typographic art.
  displayXL: {
    fontFamily: fontFamily.display,
    fontSize: 64,
    lineHeight: 66,
    letterSpacing: -1.5,
  },
  displayL: {
    fontFamily: fontFamily.display,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1,
  },
  displayM: {
    fontFamily: fontFamily.display,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: fontFamily.displayMedium,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  // Body — calm, readable
  bodyL: {
    fontFamily: fontFamily.body,
    fontSize: 18,
    lineHeight: 28,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyStrong: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: 16,
    lineHeight: 24,
  },
  label: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 18,
  },
  overline: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyToken = keyof typeof typography;
