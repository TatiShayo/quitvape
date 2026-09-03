/**
 * QuitVape color tokens — "First Light".
 *
 * PALETTE RATIONALE (this is a recovery tool, so the palette is a clinical decision,
 * not a style choice):
 *
 * 1. NO GREEN-GOOD / RED-BAD AXIS. The conventional health palette moralizes: green
 *    rewards compliance, red punishes failure. Shame following a slip is the strongest
 *    behavioural predictor of abandoning a cessation attempt — a user who feels judged
 *    deletes the app rather than logging the relapse. `danger` red survives here only
 *    for genuinely destructive confirmations (delete my data), never for the user.
 *
 * 2. LOW-AROUSAL GROUND. Indigo/periwinkle sits in the low-arousal, moderately-pleasant
 *    quadrant (Valdez & Mehrabian 1994). Cravings are an arousal spike; the interface
 *    must not add to it. Saturation stays low everywhere except the two reward tokens.
 *
 * 3. WARMTH IS SCARCE AND EARNED. `reward` amber appears only on money saved and
 *    crossed milestones. Scarcity is what keeps a reward signal legible — if everything
 *    glows, nothing reads as a win.
 *
 * 4. SLIPS GET A CARE COLOR, NOT AN ALARM COLOR. `care` is a warm, desaturated rose:
 *    a different register from reward amber, but soft enough to read as concern rather
 *    than accusation. Self-compassion (Neff) predicts faster re-engagement after a
 *    lapse than self-criticism does.
 *
 * Surfaces are translucent by design — panes float on the sky (see theme/sky.ts) so the
 * user's earned light stays visible behind every screen rather than being covered by
 * opaque cards.
 */
export const colors = {
  // Canvas. Matches the night end of the sky ramp; the live canvas is drawn by <Sky/>.
  bg: '#070A16',

  // Translucent panes. Alpha over the sky, not opaque fills.
  surface: 'rgba(255, 255, 255, 0.045)',
  surfaceElevated: 'rgba(255, 255, 255, 0.075)',
  surfacePressed: 'rgba(255, 255, 255, 0.11)',

  // Hairline borders, light-on-dark so they read as an edge catching light.
  border: 'rgba(255, 255, 255, 0.10)',
  borderStrong: 'rgba(255, 255, 255, 0.18)',

  // Signal — periwinkle. Interactive affordances and neutral emphasis.
  accent: '#9BA4F0',
  accentDim: '#6B74C4',
  accentGlow: 'rgba(155, 164, 240, 0.30)',

  // Reward — dawn amber. Money and milestones ONLY. Always tabular.
  money: '#F0B267',
  moneyDim: '#B4834B',
  reward: '#F0B267',

  // Care — slips, relapses, hard moments. Warm, never accusatory.
  care: '#E8A0A8',
  careDim: '#A8737A',

  // Text ramp, tuned against the darkest sky keyframe (all >= 4.5:1 on #070A16).
  textPrimary: '#F0EDF7',
  textSecondary: '#B4AFC6',
  textTertiary: '#7F7A93',
  textInverse: '#0A0E1C',

  // Semantic — meaning only, used sparingly.
  success: '#8FD4B0',
  warning: '#F0B267',
  /** Destructive actions only (delete account, wipe data). Never the user's behaviour. */
  danger: '#E8767E',
  dangerDim: '#A85159',

  // Utility
  overlay: 'rgba(6, 8, 18, 0.66)',
  scrim: 'rgba(6, 8, 18, 0.90)',
  transparent: 'transparent',
  white: '#FFFFFF',
} as const;

export type ColorToken = keyof typeof colors;
