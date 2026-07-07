/**
 * Taper mode math. Personalized reduction schedule: default -15%/week from baseline
 * puffs/day. Daily allowance = current week's target. When allowance drops below 20%
 * of baseline, prompt "ready to quit fully?" (BUILD_PROMPT feature 11).
 */
import { calendarDaysBetween } from './time';

export const DEFAULT_WEEKLY_REDUCTION = 0.15;
export const READY_TO_QUIT_FRACTION = 0.2;

/** Which taper week (0-indexed) the user is on, by local calendar days since start. */
export function taperWeekIndex(taperStart: Date, now: Date): number {
  const days = Math.max(0, calendarDaysBetween(taperStart, now));
  return Math.floor(days / 7);
}

/**
 * Daily puff allowance for a given week index. Geometric decay:
 * allowance = round(baseline * (1 - reduction)^week), never below 1 until the
 * ready-to-quit threshold hands off to a full quit.
 */
export function dailyAllowance(
  baselinePuffsPerDay: number,
  weekIndex: number,
  weeklyReduction: number = DEFAULT_WEEKLY_REDUCTION,
): number {
  if (baselinePuffsPerDay <= 0) return 0;
  const r = Math.min(0.9, Math.max(0, weeklyReduction));
  const raw = baselinePuffsPerDay * Math.pow(1 - r, Math.max(0, weekIndex));
  return Math.max(1, Math.round(raw));
}

/** True once the allowance has dropped below 20% of baseline (offer full quit). */
export function readyToQuitFully(
  baselinePuffsPerDay: number,
  currentAllowance: number,
): boolean {
  if (baselinePuffsPerDay <= 0) return true;
  return currentAllowance <= baselinePuffsPerDay * READY_TO_QUIT_FRACTION;
}

export interface TaperStatus {
  weekIndex: number;
  allowance: number;
  /** Puffs remaining today given how many already logged. */
  remaining: number;
  /** True if over allowance for the day. */
  overLimit: boolean;
  readyToQuit: boolean;
}

export function taperStatus(
  baselinePuffsPerDay: number,
  taperStart: Date,
  now: Date,
  puffsLoggedToday: number,
  weeklyReduction: number = DEFAULT_WEEKLY_REDUCTION,
): TaperStatus {
  const weekIndex = taperWeekIndex(taperStart, now);
  const allowance = dailyAllowance(baselinePuffsPerDay, weekIndex, weeklyReduction);
  const logged = Math.max(0, puffsLoggedToday);
  const remaining = Math.max(0, allowance - logged);
  return {
    weekIndex,
    allowance,
    remaining,
    overLimit: logged > allowance,
    readyToQuit: readyToQuitFully(baselinePuffsPerDay, allowance),
  };
}
