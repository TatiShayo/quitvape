/**
 * The sky ramp — QuitVape's core progress encoding.
 *
 * WHY A SKY INSTEAD OF A RING
 * Cleveland & McGill's perceptual ranking puts position and lightness far above area
 * for accurate, low-effort reading. A progress ring encodes with area (worst tier).
 * Ambient background lightness is read pre-attentively — you know where you are before
 * you consciously look. That matters most during a craving, when executive function is
 * suppressed and the user cannot be asked to parse a chart.
 *
 * WHY IT NEVER STARTS AT BLACK
 * Endowed progress effect (Nunes & Dreze): people who are handed a head start finish at
 * roughly twice the rate of people started at zero. `skyProgress` uses a log curve so
 * day 1 already produces visible movement, and the ramp keeps paying out for a year.
 *
 * WHY THE TOP STAYS DARK
 * Text sits on the upper two thirds throughout. Holding the zenith dark across the whole
 * ramp keeps every text token above WCAG AA at both ends of the journey — the warmth
 * arrives at the horizon, where no body copy lives.
 */

export interface SkyStops {
  /** Zenith — always dark enough to carry light text. */
  zenith: string;
  /** Mid-field — the main body of the canvas. */
  field: string;
  /** Lower sky, just above the horizon line. */
  low: string;
  /** The horizon ember. The only place real warmth is allowed to arrive. */
  horizon: string;
}

/** Four keyframes: deep night -> astronomical -> nautical -> first light. */
const KEYFRAMES: SkyStops[] = [
  { zenith: '#070A16', field: '#0C1124', low: '#141033', horizon: '#2A1F45' },
  { zenith: '#0A0E1F', field: '#141A33', low: '#241B42', horizon: '#4A2F58' },
  { zenith: '#0E1428', field: '#1D2242', low: '#392652', horizon: '#7A4560' },
  { zenith: '#151B33', field: '#2A2A50', low: '#4E3160', horizon: '#C97A5E' },
];

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

/**
 * Streak length -> 0..1 sky position. Logarithmic: day 1 ~ 0.12, day 7 ~ 0.35,
 * day 30 ~ 0.58, day 90 ~ 0.76, day 365 = 1. Early days move the sky the most,
 * which is exactly when relapse risk peaks and visible feedback is worth the most.
 */
export function skyProgress(streakDays: number): number {
  const days = Math.max(0, streakDays);
  return Math.min(1, Math.log1p(days) / Math.log1p(365));
}

/** Interpolate the four-keyframe ramp at t in [0,1]. */
export function skyAt(t: number): SkyStops {
  const clamped = Math.max(0, Math.min(1, t));
  const scaled = clamped * (KEYFRAMES.length - 1);
  const i = Math.min(KEYFRAMES.length - 2, Math.floor(scaled));
  const local = scaled - i;
  const a = KEYFRAMES[i];
  const b = KEYFRAMES[i + 1];
  return {
    zenith: mix(a.zenith, b.zenith, local),
    field: mix(a.field, b.field, local),
    low: mix(a.low, b.low, local),
    horizon: mix(a.horizon, b.horizon, local),
  };
}

/**
 * Panic-mode sky. Deliberately steps *away* from the user's earned warmth toward a cool,
 * desaturated field. Craving is a high-arousal state; Valdez & Mehrabian found blue-hue,
 * low-saturation regions produce the lowest arousal ratings of any color family. Alarm
 * colors here would compound the very state the screen exists to bring down.
 */
export const PANIC_SKY: SkyStops = {
  zenith: '#060911',
  field: '#0B1420',
  low: '#122030',
  horizon: '#1B3040',
};

export { mix as mixHex };
