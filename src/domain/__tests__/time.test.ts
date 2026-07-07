import { calendarDaysBetween, localDateKey, startOfLocalDay, MS_PER_DAY } from '../time';

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

  it('counts exactly one day across a spring-forward DST gap (23h day)', () => {
    // US spring forward 2026-03-08. Midnight-to-midnight local is 23h that day.
    const before = new Date(2026, 2, 8, 12, 0, 0);
    const after = new Date(2026, 2, 9, 12, 0, 0);
    expect(calendarDaysBetween(before, after)).toBe(1);
  });

  it('counts exactly one day across a fall-back DST gap (25h day)', () => {
    // US fall back 2026-11-01. Midnight-to-midnight local is 25h that day.
    const before = new Date(2026, 10, 1, 12, 0, 0);
    const after = new Date(2026, 10, 2, 12, 0, 0);
    expect(calendarDaysBetween(before, after)).toBe(1);
  });

  it('counts a full multi-day span', () => {
    const a = new Date(2026, 0, 1, 6, 0, 0);
    const b = new Date(2026, 0, 31, 22, 0, 0);
    expect(calendarDaysBetween(a, b)).toBe(30);
  });
});

describe('localDateKey / startOfLocalDay', () => {
  it('formats a zero-padded local date key', () => {
    expect(localDateKey(new Date(2026, 2, 5, 9, 0, 0))).toBe('2026-03-05');
  });

  it('startOfLocalDay zeroes the time component', () => {
    const d = startOfLocalDay(new Date(2026, 5, 15, 17, 45, 30, 123));
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
    expect(d.getMilliseconds()).toBe(0);
  });
});

describe('constants', () => {
  it('MS_PER_DAY is 86_400_000', () => {
    expect(MS_PER_DAY).toBe(86_400_000);
  });
});
