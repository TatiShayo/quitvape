/**
 * Weekly progress report math (BUILD_PROMPT feature 13): cravings resisted, mood trend,
 * and a 7-day streak-status chart for the Sunday report + its share card. Pure + tested,
 * same pattern as the other domain modules.
 */
import { CheckIn, CravingEvent } from './types';
import { localDateKey, MS_PER_DAY } from './time';

export interface WeeklyReport {
  /** Last 7 local calendar dates (oldest first), YYYY-MM-DD. */
  days: string[];
  cravingsResisted: number;
  cravingsSlipped: number;
  /** Average mood (1-5) across check-ins made this window; undefined if no check-ins. */
  averageMood?: number;
  /** Mood value per day in `days`, undefined for days with no check-in. */
  moodByDay: (number | undefined)[];
  checkInCount: number;
}

/** Builds the last-7-day report ending on `now` (inclusive of today). */
export function buildWeeklyReport(
  cravings: CravingEvent[],
  checkIns: CheckIn[],
  now: Date,
): WeeklyReport {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    days.push(localDateKey(new Date(now.getTime() - i * MS_PER_DAY)));
  }
  const daySet = new Set(days);

  const windowStart = now.getTime() - 7 * MS_PER_DAY;
  const inWindow = cravings.filter((c) => {
    const t = new Date(c.ts).getTime();
    return Number.isFinite(t) && t >= windowStart && t <= now.getTime();
  });

  const cravingsResisted = inWindow.filter((c) => c.resisted).length;
  const cravingsSlipped = inWindow.filter((c) => !c.resisted).length;

  const moodByDate = new Map<string, number>();
  for (const ci of checkIns) {
    if (daySet.has(ci.date)) moodByDate.set(ci.date, ci.mood);
  }
  const moodByDay = days.map((d) => moodByDate.get(d));
  const moods = moodByDay.filter((m): m is number => m !== undefined);
  const averageMood = moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : undefined;

  return {
    days,
    cravingsResisted,
    cravingsSlipped,
    averageMood,
    moodByDay,
    checkInCount: moods.length,
  };
}
