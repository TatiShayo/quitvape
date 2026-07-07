/**
 * QuitVape color tokens — "midnight premium wellness".
 * Layered dark surfaces, a single teal accent (glow reserved for the streak ring),
 * warm amber for money numbers. Semantic colors reserved for meaning only.
 * Per BUILD_PROMPT art direction + PLAYBOOK 1.3.
 */
export const colors = {
  // Layered dark surfaces (canvas -> raised -> elevated)
  bg: '#0B1220',
  surface: '#121A26',
  surfaceElevated: '#1A2433',
  surfacePressed: '#222E3F',

  // 1px low-contrast borders (depth via borders + layered shadow, not heavy drops)
  border: '#22303F',
  borderStrong: '#2E3E50',

  // Signature accent (teal) — used sparingly (~5% of a screen)
  accent: '#2DD4BF',
  accentDim: '#1E9E8F',
  accentGlow: 'rgba(45, 212, 191, 0.35)',

  // Money — warm amber, always tabular
  money: '#F5B14C',
  moneyDim: '#B9843A',

  // Text ramp
  textPrimary: '#F2F6FB',
  textSecondary: '#AEBCCC',
  textTertiary: '#6E7F92',
  textInverse: '#0B1220',

  // Semantic — meaning only
  success: '#3FCF8E',
  warning: '#F5B14C',
  danger: '#F16A6A',
  dangerDim: '#B84E4E',

  // Utility
  overlay: 'rgba(6, 10, 18, 0.72)',
  scrim: 'rgba(6, 10, 18, 0.92)',
  transparent: 'transparent',
  white: '#FFFFFF',
} as const;

export type ColorToken = keyof typeof colors;
