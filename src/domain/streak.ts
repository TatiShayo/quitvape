/**
 * Streak math. Pure functions over the quit plan + relapses. Unit-tested for timezone
 * and DST edge cases (QA gate).
 *
 * Definitions:
 * - "Current streak days" = full LOCAL calendar days since the current streakStart,
 *   clamped at 0 (a future streakStart or a clock skew never yields a negative streak).
 * - "Lifetime vape-free days" = sum of every completed streak, so a relapse resets the
 *   visible streak but the lifetime stat keeps counting (BUILD_PROMPT relapse flow).
 * - The live "days:hours:mins" counter uses ELAPSED time from streakStart.
 */
import { MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE, calendarDaysBetween, elapsedMs } from './time';
import { Relapse } from './types';

export interface LiveDuration {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

/** Whole local calendar days in the current streak (>= 0). */
export function currentStreakDays(streakStart: Date, now: Date): number {
  return Math.max(0, calendarDaysBetween(streakStart, now));
}

/** Live elapsed breakdown for the big counter. Clamped at 0. */
export function liveDuration(streakStart: Date, now: Date): LiveDuration {
  const totalMs = Math.max(0, elapsedMs(streakStart, now));
  const days = Math.floor(totalMs / MS_PER_DAY);
  const hours = Math.floor((totalMs % MS_PER_DAY) / MS_PER_HOUR);
  const minutes = Math.floor((totalMs % MS_PER_HOUR) / MS_PER_MINUTE);
  const seconds = Math.floor((totalMs % MS_PER_MINUTE) / 1000);
  return { days, hours, minutes, seconds, totalMs };
}

/**
 * Lifetime vape-free calendar days across all attempts. Each relapse closes a segment
 * (originalStart..relapse), the final open segment runs to `now`. Overlaps impossible
 * because relapses are chronological; we defensively sort and ignore out-of-range ones.
 */
export function lifetimeVapeFreeDays(
  originalQuitDate: Date,
  relapses: Relapse[],
  now: Date,
): number {
  const points = [...relapses]
    .map((r) => new Date(r.ts))
    .filter((d) => !Number.isNaN(d.getTime()) && d.getTime() >= originalQuitDate.getTime())
    .sort((a, b) => a.getTime() - b.getTime());

  let total = 0;
  let segmentStart = originalQuitDate;
  for (const relapseAt of points) {
    total += Math.max(0, calendarDaysBetween(segmentStart, relapseAt));
    segmentStart = relapseAt;
  }
  total += Math.max(0, calendarDaysBetween(segmentStart, now));
  return total;
}

/** Milestone ladder (days) used for the progress ring + celebrations. */
export const STREAK_MILESTONES = [1, 3, 7, 14, 30, 60, 90, 180, 365] as const;

export interface MilestoneProgress {
  /** Last milestone reached (0 if none yet). */
  current: number;
  /** Next milestone to reach (undefined once all are cleared). */
  next?: number;
  /** 0..1 progress from current milestone toward next. */
  progress: number;
}

export function milestoneProgress(streakDays: number): MilestoneProgress {
  let current = 0;
  let next: number | undefined;
  for (const m of STREAK_MILESTONES) {
    if (streakDays >= m) current = m;
    else {
      next = m;
      break;
    }
  }
  if (next === undefined) return { current, next: undefined, progress: 1 };
  const span = next - current;
  const progress = span <= 0 ? 1 : Math.min(1, Math.max(0, (streakDays - current) / span));
  return { current, next, progress };
}

/** Lung-visual stage keyed to streak length (day 1/3/7/14/30/90 staged states). */
export const LUNG_STAGES = [0, 1, 3, 7, 14, 30, 90] as const;
export type LungStage = (typeof LUNG_STAGES)[number];

export function lungStage(streakDays: number): LungStage {
  let stage: LungStage = 0;
  for (const s of LUNG_STAGES) {
    if (streakDays >= s) stage = s;
  }
  return stage;
}
