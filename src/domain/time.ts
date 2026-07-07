/**
 * Time helpers used across streak/money math. Kept pure and dependency-free so they
 * are trivially unit-testable, including timezone/DST edge cases (BUILD_PROMPT QA).
 *
 * Distinction that drives correctness:
 * - ELAPSED time (ms between two instants) is used for live-ticking counters.
 * - CALENDAR days (difference in local Y/M/D) is used for "streak days" and check-ins,
 *   so a user who quit at 11pm reaches "Day 1" at their local midnight, and DST days
 *   (23h or 25h long) still count as exactly one calendar day.
 */

export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

/** Local calendar date key YYYY-MM-DD for a Date (respects the host timezone). */
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Local midnight (00:00:00.000 local) for the calendar date containing `d`. */
export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/**
 * Whole calendar days between two instants, by LOCAL date, DST-safe.
 * Counts date boundaries crossed, not 24h blocks: quitting 11pm Mon and checking at
 * 1am Tue => 1 calendar day even though only 2 hours elapsed. Result can be negative
 * if `later` precedes `earlier`.
 */
export function calendarDaysBetween(earlier: Date, later: Date): number {
  const a = startOfLocalDay(earlier).getTime();
  const b = startOfLocalDay(later).getTime();
  // Round because a DST transition makes the raw ms difference 23h or 25h.
  return Math.round((b - a) / MS_PER_DAY);
}

/** Elapsed milliseconds between two instants (never negative-clamped here). */
export function elapsedMs(from: Date, to: Date): number {
  return to.getTime() - from.getTime();
}
