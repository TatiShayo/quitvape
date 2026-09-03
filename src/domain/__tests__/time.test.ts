import {
  calendarDaysBetween,
  localDateKey,
  startOfLocalDay,
  isLeapYear,
  daysInMonth,
  addCalendarDays,
  addCalendarMonths,
  addCalendarYears,
  calendarDurationBreakdown,
  formatDurationHuman,
  isValidDate,
  elapsedMs,
} from '../time';

describe('isLeapYear', () => {
  it('identifies standard leap years', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2028)).toBe(true);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(2400)).toBe(true);
  });

  it('identifies non-leap years (including century non-leap years)', () => {
    expect(isLeapYear(2023)).toBe(false);
    expect(isLeapYear(2025)).toBe(false);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2100)).toBe(false);
    expect(isLeapYear(2200)).toBe(false);
    expect(isLeapYear(2300)).toBe(false);
  });

  it('handles invalid inputs gracefully', () => {
    expect(isLeapYear(NaN)).toBe(false);
    expect(isLeapYear(Infinity)).toBe(false);
    expect(isLeapYear(2024.5)).toBe(false);
  });
});

describe('daysInMonth', () => {
  it('returns 29 for February in a leap year', () => {
    expect(daysInMonth(2024, 1)).toBe(29);
    expect(daysInMonth(2000, 1)).toBe(29);
  });

  it('returns 28 for February in a normal year', () => {
    expect(daysInMonth(2023, 1)).toBe(28);
    expect(daysInMonth(2100, 1)).toBe(28);
  });

  it('returns correct day counts for all standard months', () => {
    expect(daysInMonth(2024, 0)).toBe(31); // Jan
    expect(daysInMonth(2024, 2)).toBe(31); // Mar
    expect(daysInMonth(2024, 3)).toBe(30); // Apr
    expect(daysInMonth(2024, 4)).toBe(31); // May
    expect(daysInMonth(2024, 5)).toBe(30); // Jun
    expect(daysInMonth(2024, 6)).toBe(31); // Jul
    expect(daysInMonth(2024, 7)).toBe(31); // Aug
    expect(daysInMonth(2024, 8)).toBe(30); // Sep
    expect(daysInMonth(2024, 9)).toBe(31); // Oct
    expect(daysInMonth(2024, 10)).toBe(30); // Nov
    expect(daysInMonth(2024, 11)).toBe(31); // Dec
  });

  it('wraps out-of-range month indices safely', () => {
    expect(daysInMonth(2024, 12)).toBe(31); // Jan
    expect(daysInMonth(2024, -1)).toBe(31); // Dec
  });
});

describe('calendarDaysBetween', () => {
  it('counts a date-boundary crossing even when only 2 hours elapse', () => {
    // 11pm Monday -> 1am Tuesday (local): 1 calendar day, 2 real hours.
    const quit = new Date(2026, 0, 5, 23, 0, 0);
    const check = new Date(2026, 0, 6, 1, 0, 0);
    expect(calendarDaysBetween(quit, check)).toBe(1);
  });

  it('returns 0 within the same local day regardless of hours elapsed', () => {
    const a = new Date(2026, 0, 5, 0, 30, 0);
    const b = new Date(2026, 0, 5, 23, 30, 0);
    expect(calendarDaysBetween(a, b)).toBe(0);
  });

  it('is symmetric-negative when later precedes earlier', () => {
    const a = new Date(2026, 0, 10, 12, 0, 0);
    const b = new Date(2026, 0, 8, 12, 0, 0);
    expect(calendarDaysBetween(a, b)).toBe(-2);
  });

  it('counts leap year day correctly (Feb 28 to Mar 1)', () => {
    const feb28Leap = new Date(2024, 1, 28, 12, 0, 0);
    const mar1Leap = new Date(2024, 2, 1, 12, 0, 0);
    expect(calendarDaysBetween(feb28Leap, mar1Leap)).toBe(2); // Includes Feb 29

    const feb28NonLeap = new Date(2023, 1, 28, 12, 0, 0);
    const mar1NonLeap = new Date(2023, 2, 1, 12, 0, 0);
    expect(calendarDaysBetween(feb28NonLeap, mar1NonLeap)).toBe(1);
  });

  it('counts exactly one day across a spring-forward DST gap (23h day)', () => {
    const before = new Date(2026, 2, 8, 12, 0, 0);
    const after = new Date(2026, 2, 9, 12, 0, 0);
    expect(calendarDaysBetween(before, after)).toBe(1);
  });

  it('counts exactly one day across a fall-back DST gap (25h day)', () => {
    const before = new Date(2026, 10, 1, 12, 0, 0);
    const after = new Date(2026, 10, 2, 12, 0, 0);
    expect(calendarDaysBetween(before, after)).toBe(1);
  });

  it('returns 0 for invalid dates', () => {
    expect(calendarDaysBetween(new Date('invalid'), new Date())).toBe(0);
    expect(calendarDaysBetween(new Date(), new Date('invalid'))).toBe(0);
  });
});

describe('elapsedMs', () => {
  it('calculates millisecond differences accurately', () => {
    const a = new Date(2026, 0, 1, 0, 0, 0);
    const b = new Date(2026, 0, 1, 0, 1, 0);
    expect(elapsedMs(a, b)).toBe(60_000);
  });

  it('returns 0 for invalid dates', () => {
    expect(elapsedMs(new Date('invalid'), new Date())).toBe(0);
  });
});

describe('addCalendarDays, addCalendarMonths, addCalendarYears', () => {
  it('adds days across month boundaries', () => {
    const d = new Date(2026, 0, 30, 10, 0, 0);
    const next = addCalendarDays(d, 3);
    expect(localDateKey(next)).toBe('2026-02-02');
  });

  it('subtracts days correctly', () => {
    const d = new Date(2026, 2, 1, 10, 0, 0);
    const prev = addCalendarDays(d, -1);
    expect(localDateKey(prev)).toBe('2026-02-28');
  });

  it('adds months and clamps day if necessary (Jan 31 -> Feb 28/29)', () => {
    const jan31Leap = new Date(2024, 0, 31, 10, 0, 0);
    const febLeap = addCalendarMonths(jan31Leap, 1);
    expect(localDateKey(febLeap)).toBe('2024-02-29');

    const jan31NonLeap = new Date(2023, 0, 31, 10, 0, 0);
    const febNonLeap = addCalendarMonths(jan31NonLeap, 1);
    expect(localDateKey(febNonLeap)).toBe('2023-02-28');
  });

  it('adds years and clamps Feb 29 to Feb 28 on non-leap destination years', () => {
    const leapDate = new Date(2024, 1, 29, 12, 0, 0);
    const oneYearLater = addCalendarYears(leapDate, 1);
    expect(localDateKey(oneYearLater)).toBe('2025-02-28');

    const fourYearsLater = addCalendarYears(leapDate, 4);
    expect(localDateKey(fourYearsLater)).toBe('2028-02-29');
  });
});

describe('calendarDurationBreakdown', () => {
  it('calculates exact breakdown for multi-year leap span', () => {
    const start = new Date(2024, 0, 1, 0, 0, 0);
    const end = new Date(2025, 0, 1, 0, 0, 0);
    const breakdown = calendarDurationBreakdown(start, end);
    expect(breakdown.years).toBe(1);
    expect(breakdown.months).toBe(0);
    expect(breakdown.days).toBe(0);
    expect(breakdown.totalDays).toBe(366); // 2024 is leap year
  });

  it('never returns negative days or negative fields across uneven months (Jan 31 -> Mar 1)', () => {
    const start = new Date(2026, 0, 31, 12, 0, 0);
    const end = new Date(2026, 2, 1, 12, 0, 0);
    const breakdown = calendarDurationBreakdown(start, end);
    expect(breakdown.years).toBe(0);
    expect(breakdown.months).toBe(1); // Jan 31 -> Feb 28 is 1 month
    expect(breakdown.days).toBe(1); // Feb 28 -> Mar 1 is 1 day
    expect(breakdown.hours).toBe(0);
    expect(breakdown.minutes).toBe(0);
    expect(breakdown.seconds).toBe(0);
    expect(breakdown.days).toBeGreaterThanOrEqual(0);
  });

  it('handles partial days, hours, and minutes', () => {
    const start = new Date(2026, 0, 1, 10, 30, 0);
    const end = new Date(2026, 0, 3, 14, 45, 30);
    const breakdown = calendarDurationBreakdown(start, end);
    expect(breakdown.days).toBe(2);
    expect(breakdown.hours).toBe(4);
    expect(breakdown.minutes).toBe(15);
    expect(breakdown.seconds).toBe(30);
  });

  it('returns zeroes if end precedes start or dates match', () => {
    const start = new Date(2026, 5, 1);
    const end = new Date(2026, 4, 1);
    const breakdown = calendarDurationBreakdown(start, end);
    expect(breakdown.years).toBe(0);
    expect(breakdown.months).toBe(0);
    expect(breakdown.days).toBe(0);
    expect(breakdown.totalDays).toBe(0);
    expect(breakdown.totalMs).toBe(0);

    const same = calendarDurationBreakdown(start, start);
    expect(same.totalDays).toBe(0);
  });

  it('handles invalid dates gracefully', () => {
    const invalid = calendarDurationBreakdown(new Date('invalid'), new Date());
    expect(invalid.totalDays).toBe(0);
    expect(invalid.years).toBe(0);
  });
});

describe('formatDurationHuman', () => {
  it('formats full year and month strings', () => {
    expect(
      formatDurationHuman({
        years: 1,
        months: 2,
        days: 5,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalDays: 430,
        totalMs: 1000,
      }),
    ).toBe('1 year, 2 months, 5 days');

    expect(
      formatDurationHuman({
        years: 2,
        months: 1,
        days: 1,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalDays: 760,
        totalMs: 1000,
      }),
    ).toBe('2 years, 1 month, 1 day');
  });

  it('formats hours and minutes when less than a day', () => {
    expect(
      formatDurationHuman({
        years: 0,
        months: 0,
        days: 0,
        hours: 5,
        minutes: 30,
        seconds: 0,
        totalDays: 0,
        totalMs: 1000,
      }),
    ).toBe('0 days, 5 hours, 30 mins');

    expect(
      formatDurationHuman({
        years: 0,
        months: 0,
        days: 1,
        hours: 3,
        minutes: 0,
        seconds: 0,
        totalDays: 1,
        totalMs: 1000,
      }),
    ).toBe('1 day, 3 hours');
  });
});

describe('localDateKey / startOfLocalDay / isValidDate', () => {
  it('formats a zero-padded local date key', () => {
    expect(localDateKey(new Date(2026, 2, 5, 9, 0, 0))).toBe('2026-03-05');
  });

  it('handles invalid date input in localDateKey', () => {
    expect(localDateKey(new Date(NaN))).toBe('');
    expect(localDateKey(null as unknown as Date)).toBe('');
  });

  it('validates dates correctly', () => {
    expect(isValidDate(new Date())).toBe(true);
    expect(isValidDate(new Date(NaN))).toBe(false);
    expect(isValidDate('2026-01-01')).toBe(false);
    expect(isValidDate(null)).toBe(false);
    expect(isValidDate(undefined)).toBe(false);
  });

  it('startOfLocalDay zeroes the time component', () => {
    const d = startOfLocalDay(new Date(2026, 5, 15, 17, 45, 30, 123));
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
    expect(d.getMilliseconds()).toBe(0);
  });

  it('startOfLocalDay handles invalid date by returning Epoch', () => {
    const d = startOfLocalDay(new Date(NaN));
    expect(d.getTime()).toBe(0);
  });
});
