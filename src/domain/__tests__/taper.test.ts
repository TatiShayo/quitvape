import {
  DEFAULT_WEEKLY_REDUCTION,
  READY_TO_QUIT_FRACTION,
  dailyAllowance,
  readyToQuitFully,
  taperStatus,
  taperWeekIndex,
} from '../taper';

describe('taperWeekIndex', () => {
  it('is 0 for the first 6 days', () => {
    const start = new Date(2026, 0, 1);
    expect(taperWeekIndex(start, new Date(2026, 0, 1))).toBe(0);
    expect(taperWeekIndex(start, new Date(2026, 0, 6))).toBe(0);
  });

  it('steps to 1 exactly at day 7', () => {
    const start = new Date(2026, 0, 1);
    expect(taperWeekIndex(start, new Date(2026, 0, 8))).toBe(1);
  });

  it('clamps to 0 for a start date in the future (clock skew)', () => {
    const start = new Date(2026, 0, 10);
    expect(taperWeekIndex(start, new Date(2026, 0, 1))).toBe(0);
  });

  it('is DST-safe across a spring-forward week boundary', () => {
    const start = new Date(2026, 2, 1); // Mar 1 2026
    const now = new Date(2026, 2, 8); // Mar 8 2026 (spring-forward day), 7 days later
    expect(taperWeekIndex(start, now)).toBe(1);
  });
});

describe('dailyAllowance', () => {
  it('returns the baseline unchanged at week 0', () => {
    expect(dailyAllowance(100, 0)).toBe(100);
  });

  it('applies the default -15%/week geometric decay', () => {
    expect(dailyAllowance(100, 1)).toBe(85);
    expect(dailyAllowance(100, 2)).toBe(Math.round(100 * 0.85 * 0.85));
  });

  it('never drops below 1 regardless of how many weeks elapse', () => {
    expect(dailyAllowance(100, 50)).toBeGreaterThanOrEqual(1);
    expect(dailyAllowance(1, 100)).toBe(1);
  });

  it('returns 0 for a non-positive baseline (guards against bad data)', () => {
    expect(dailyAllowance(0, 3)).toBe(0);
    expect(dailyAllowance(-5, 3)).toBe(0);
  });

  it('honors a custom weekly reduction, clamped to [0, 0.9]', () => {
    expect(dailyAllowance(100, 1, 0.5)).toBe(50);
    expect(dailyAllowance(100, 1, 5)).toBe(10); // clamped to 0.9 reduction -> 10% remains
    expect(dailyAllowance(100, 1, -1)).toBe(100); // clamped to 0 reduction -> unchanged
  });

  it('matches the exported default reduction constant', () => {
    expect(dailyAllowance(200, 1)).toBe(Math.round(200 * (1 - DEFAULT_WEEKLY_REDUCTION)));
  });
});

describe('readyToQuitFully', () => {
  it('is true once allowance falls to or below 20% of baseline', () => {
    expect(readyToQuitFully(100, 20)).toBe(true);
    expect(readyToQuitFully(100, 19)).toBe(true);
    expect(readyToQuitFully(100, 21)).toBe(false);
  });

  it('matches the exported READY_TO_QUIT_FRACTION constant', () => {
    const baseline = 150;
    const boundary = baseline * READY_TO_QUIT_FRACTION;
    expect(readyToQuitFully(baseline, boundary)).toBe(true);
  });

  it('is true for a non-positive baseline (nothing left to taper)', () => {
    expect(readyToQuitFully(0, 0)).toBe(true);
    expect(readyToQuitFully(-1, 0)).toBe(true);
  });
});

describe('taperStatus', () => {
  it('combines allowance, remaining, overLimit, and readyToQuit for the home ring', () => {
    const start = new Date(2026, 0, 1);
    const now = new Date(2026, 0, 1, 12); // still week 0
    const status = taperStatus(100, start, now, 30);
    expect(status.weekIndex).toBe(0);
    expect(status.allowance).toBe(100);
    expect(status.remaining).toBe(70);
    expect(status.overLimit).toBe(false);
    expect(status.readyToQuit).toBe(false);
  });

  it('flags overLimit when logged puffs exceed the day allowance', () => {
    const start = new Date(2026, 0, 1);
    const status = taperStatus(100, start, start, 150);
    expect(status.overLimit).toBe(true);
    expect(status.remaining).toBe(0);
  });

  it('clamps negative logged-puff input to 0 remaining-usage impact', () => {
    const start = new Date(2026, 0, 1);
    const status = taperStatus(100, start, start, -10);
    expect(status.remaining).toBe(100);
    expect(status.overLimit).toBe(false);
  });

  it('surfaces readyToQuit once many weeks of decay pass', () => {
    const start = new Date(2026, 0, 1);
    const now = new Date(2026, 5, 1); // months later, many weeks of -15%/week decay
    const status = taperStatus(100, start, now, 0);
    expect(status.readyToQuit).toBe(true);
  });
});
