/**
 * Time helpers used across streak/money math. Kept pure and dependency-free so they
 * are trivially unit-testable, including timezone/DST edge cases and leap years.
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
export const DAYS_PER_WEEK = 7;

/** Returns true if a given year is a leap year (e.g. 2024, 2028). */
export function isLeapYear(year: number): boolean {
  if (!Number.isInteger(year)) return false;
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Number of days in a month (month is 0-indexed: 0 = Jan, 1 = Feb, ..., 11 = Dec). */
export function daysInMonth(year: number, monthZeroIndexed: number): number {
  if (monthZeroIndexed === 1) {
    return isLeapYear(year) ? 29 : 28;
  }
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return days[((monthZeroIndexed % 12) + 12) % 12] ?? 30;
}

/** Checks if a date object represents a valid Date instance. */
export function isValidDate(d: unknown): d is Date {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

/** Local calendar date key YYYY-MM-DD for a Date (respects the host timezone). */
export function localDateKey(d: Date): string {
  if (!isValidDate(d)) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Local midnight (00:00:00.000 local) for the calendar date containing `d`. */
export function startOfLocalDay(d: Date): Date {
  if (!isValidDate(d)) return new Date(0);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/**
 * Whole calendar days between two instants, by LOCAL date, DST-safe.
 * Counts date boundaries crossed, not 24h blocks: quitting 11pm Mon and checking at
 * 1am Tue => 1 calendar day even though only 2 hours elapsed. Result can be negative
 * if `later` precedes `earlier`.
 */
export function calendarDaysBetween(earlier: Date, later: Date): number {
  if (!isValidDate(earlier) || !isValidDate(later)) return 0;
  const a = startOfLocalDay(earlier).getTime();
  const b = startOfLocalDay(later).getTime();
  // Round because a DST transition makes the raw ms difference 23h or 25h.
  return Math.round((b - a) / MS_PER_DAY);
}

/** Elapsed milliseconds between two instants (never negative-clamped here). */
export function elapsedMs(from: Date, to: Date): number {
  if (!isValidDate(from) || !isValidDate(to)) return 0;
  return to.getTime() - from.getTime();
}

/** Adds N calendar days to a Date, returning a new Date object. */
export function addCalendarDays(date: Date, days: number): Date {
  if (!isValidDate(date)) return new Date(0);
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Adds N calendar months to a Date, clamping day-of-month to month length. */
export function addCalendarMonths(date: Date, months: number): Date {
  if (!isValidDate(date)) return new Date(0);
  const y = date.getFullYear();
  const m = date.getMonth() + months;
  const d = date.getDate();
  const targetYear = y + Math.floor(m / 12);
  const targetMonth = ((m % 12) + 12) % 12;
  const maxDay = daysInMonth(targetYear, targetMonth);
  const targetDay = Math.min(d, maxDay);
  return new Date(
    targetYear,
    targetMonth,
    targetDay,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
}

/** Adds N calendar years to a Date, clamping day-of-month to leap/non-leap month length. */
export function addCalendarYears(date: Date, years: number): Date {
  return addCalendarMonths(date, years * 12);
}

export interface CalendarDurationBreakdown {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  totalMs: number;
}

/**
 * Calculates human-accurate duration breakdown (years, months, days, hours, minutes, seconds)
 * between two dates, accurately accounting for leap years, varying month lengths (Feb 28/29,
 * 30/31 days), and clock skews using a monotonic forward cursor.
 */
export function calendarDurationBreakdown(earlier: Date, later: Date): CalendarDurationBreakdown {
  if (!isValidDate(earlier) || !isValidDate(later)) {
    return {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalDays: 0,
      totalMs: 0,
    };
  }

  const totalMs = Math.max(0, elapsedMs(earlier, later));
  const totalDays = Math.max(0, calendarDaysBetween(earlier, later));

  if (earlier.getTime() >= later.getTime()) {
    return {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalDays: 0,
      totalMs: 0,
    };
  }

  let cursor = new Date(earlier);

  // 1. Advance whole years
  let years = 0;
  while (true) {
    const nextYear = addCalendarYears(cursor, 1);
    if (nextYear.getTime() <= later.getTime()) {
      cursor = nextYear;
      years++;
    } else {
      break;
    }
  }

  // 2. Advance whole months
  let months = 0;
  while (true) {
    const nextMonth = addCalendarMonths(cursor, 1);
    if (nextMonth.getTime() <= later.getTime()) {
      cursor = nextMonth;
      months++;
    } else {
      break;
    }
  }

  // 3. Advance whole days
  let days = 0;
  while (true) {
    const nextDay = addCalendarDays(cursor, 1);
    if (nextDay.getTime() <= later.getTime()) {
      cursor = nextDay;
      days++;
    } else {
      break;
    }
  }

  // 4. Remainder milliseconds
  let remainderMs = Math.max(0, later.getTime() - cursor.getTime());
  const hours = Math.floor(remainderMs / MS_PER_HOUR);
  remainderMs %= MS_PER_HOUR;
  const minutes = Math.floor(remainderMs / MS_PER_MINUTE);
  remainderMs %= MS_PER_MINUTE;
  const seconds = Math.floor(remainderMs / MS_PER_SECOND);

  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    totalDays,
    totalMs,
  };
}

/** Formats a duration breakdown into a concise human string (e.g. "1 year, 2 months, 4 days"). */
export function formatDurationHuman(breakdown: CalendarDurationBreakdown): string {
  const parts: string[] = [];
  if (breakdown.years > 0) {
    parts.push(`${breakdown.years} ${breakdown.years === 1 ? 'year' : 'years'}`);
  }
  if (breakdown.months > 0) {
    parts.push(`${breakdown.months} ${breakdown.months === 1 ? 'month' : 'months'}`);
  }
  if (breakdown.days > 0 || (breakdown.years === 0 && breakdown.months === 0)) {
    parts.push(`${breakdown.days} ${breakdown.days === 1 ? 'day' : 'days'}`);
  }
  if (breakdown.years === 0 && breakdown.months === 0) {
    if (breakdown.hours > 0) {
      parts.push(`${breakdown.hours} ${breakdown.hours === 1 ? 'hour' : 'hours'}`);
    }
    if (breakdown.days === 0 && breakdown.minutes > 0) {
      parts.push(`${breakdown.minutes} ${breakdown.minutes === 1 ? 'min' : 'mins'}`);
    }
  }
  return parts.join(', ');
}
