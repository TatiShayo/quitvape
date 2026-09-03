/**
 * Typography tokens — Fraunces (display serif) + Inter Tight (body/UI).
 *
 * The scale is deliberately steep. On a recovery screen there is exactly one number
 * that matters at any moment, and the type should make that unambiguous without the
 * user having to hunt: hero at 92, next tier at 36. Von Restorff — the isolated,
 * distinct element is what gets recalled, and the hero number is what we want carried
 * out of the app and into the moment the craving actually hits.
 *
 * All numeric displays use tabular figures so a ticking counter never jitters. A number
 * that shifts horizontally every second reads as unstable, which is the opposite of the
 * feeling a streak counter is there to produce.
 *
 * Font family keys must match the names loaded in src/theme/fonts.ts.
 */
import { TextStyle } from 'react-native';

export const fontFamily = {
  display: 'Fraunces_700Bold',
  displaySemi: 'Fraunces_600SemiBold',
  displayRegular: 'Fraunces_400Regular',
  body: 'InterTight_400Regular',
  bodyMedium: 'InterTight_500Medium',
  bodySemibold: 'InterTight_600SemiBold',
  /** Back-compat alias — older screens reference fontFamily.displayMedium. */
  displayMedium: 'Fraunces_600SemiBold',
} as const;

/** Applied to any numeric display (streak, money, timers) for tabular alignment. */
export const tabularNums: TextStyle = {
  fontVariant: ['tabular-nums'],
};

export const typography = {
  /** The hero numeral. Only ever one of these on screen. */
  displayXXL: {
    fontFamily: fontFamily.display,
    fontSize: 92,
    lineHeight: 92,
    letterSpacing: -3.5,
  },
  displayXL: {
    fontFamily: fontFamily.display,
    fontSize: 60,
    lineHeight: 62,
    letterSpacing: -2,
  },
  displayL: {
    fontFamily: fontFamily.displaySemi,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1.2,
  },
  displayM: {
    fontFamily: fontFamily.displaySemi,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
  },
  /** Section and screen headings. Regular weight — serif at scale needs no bolding. */
  title: {
    fontFamily: fontFamily.displayRegular,
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: -0.2,
  },

  // Body — Inter Tight. Generous leading; this app is often read in a bad moment.
  bodyL: {
    fontFamily: fontFamily.body,
    fontSize: 17,
    lineHeight: 28,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 24,
  },
  bodyStrong: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: 15,
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
    lineHeight: 19,
  },
  /** Quiet structural markers. Wide tracking so uppercase stays readable at 11px. */
  overline: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyToken = keyof typeof typography;
