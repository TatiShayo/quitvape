/**
 * Motion tokens. 150-250ms spring transitions on interactive elements (PLAYBOOK 1.4).
 * Durations in ms; spring configs for Reanimated withSpring.
 */
export const duration = {
  fast: 150,
  base: 220,
  slow: 400,
  breath: 4000, // 4-7-8 breathing phase base
} as const;

export const spring = {
  press: { damping: 18, stiffness: 320, mass: 0.6 },
  gentle: { damping: 20, stiffness: 140, mass: 0.9 },
  bouncy: { damping: 12, stiffness: 180, mass: 0.8 },
} as const;

/** Press scale for interactive elements (PLAYBOOK 1.4: scale 0.97 press). */
export const PRESS_SCALE = 0.97;
