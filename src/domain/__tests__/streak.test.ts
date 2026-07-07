import {
  LUNG_STAGES,
  STREAK_MILESTONES,
  currentStreakDays,
  lifetimeVapeFreeDays,
  liveDuration,
  lungStage,
  milestoneProgress,
} from '../streak';
import { Relapse } from '../types';

describe('currentStreakDays', () => {
  it('is 0 on the same local day as streakStart', () => {
    const start = new Date(2026, 0, 5, 22, 0, 0);
    const now = new Date(2026, 0, 5, 23, 30, 0);
    expect(currentStreakDays(start, now)).toBe(0);
  });

  it('crosses to 1 at local midnight even after only a couple hours', () => {
    const start = new Date(2026, 0, 5, 23, 0, 0);
    const now = new Date(2026, 0, 6, 1, 0, 0);
    expect(currentStreakDays(start, now)).toBe(1);
  });

  it('clamps to 0 when now precedes streakStart (clock skew)', () => {
    const start = new Date(2026, 0, 10, 0, 0, 0);
    const now = new Date(2026, 0, 5, 0, 0, 0);
    expect(currentStreakDays(start, now)).toBe(0);
  });

  it('is DST-safe across a spring-forward transition', () => {
    const start = new Date(2026, 2, 8, 6, 0, 0);
    const now = new Date(2026, 2, 9, 6, 0, 0);
    expect(currentStreakDays(start, now)).toBe(1);
  });
});

describe('liveDuration', () => {
  it('breaks down elapsed ms into days/hours/minutes/seconds', () => {
    const start = new Date(2026, 0, 1, 0, 0, 0);
    // 1 day, 2 hours, 3 minutes, 4 seconds later.
    const now = new Date(start.getTime() + 26 * 3600_000 + 3 * 60_000 + 4_000);
    const d = liveDuration(start, now);
    expect(d).toEqual({ days: 1, hours: 2, minutes: 3, seconds: 4, totalMs: d.totalMs });
  });

  it('clamps to all-zero when now precedes start', () => {
    const start = new Date(2026, 0, 10);
    const now = new Date(2026, 0, 5);
    expect(liveDuration(start, now)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
  });
});

describe('lifetimeVapeFreeDays', () => {
  it('sums segments across relapses, with the streak resetting but lifetime accumulating', () => {
    const original = new Date(2026, 0, 1);
    const relapses: Relapse[] = [
      { ts: new Date(2026, 0, 11).toISOString(), trigger: 'stress' }, // 10 days
      { ts: new Date(2026, 0, 21).toISOString(), trigger: 'boredom' }, // +10 days
    ];
    const now = new Date(2026, 0, 26); // +5 days open segment
    expect(lifetimeVapeFreeDays(original, relapses, now)).toBe(25);
  });

  it('returns just the open segment when there are no relapses', () => {
    const original = new Date(2026, 0, 1);
    const now = new Date(2026, 0, 8);
    expect(lifetimeVapeFreeDays(original, [], now)).toBe(7);
  });

  it('ignores out-of-range relapses (before the original quit date)', () => {
    const original = new Date(2026, 0, 10);
    const relapses: Relapse[] = [{ ts: new Date(2026, 0, 1).toISOString(), trigger: 'other' }];
    const now = new Date(2026, 0, 15);
    expect(lifetimeVapeFreeDays(original, relapses, now)).toBe(5);
  });

  it('sorts out-of-order relapses chronologically before summing', () => {
    const original = new Date(2026, 0, 1);
    const relapses: Relapse[] = [
      { ts: new Date(2026, 0, 21).toISOString(), trigger: 'boredom' },
      { ts: new Date(2026, 0, 11).toISOString(), trigger: 'stress' },
    ];
    const now = new Date(2026, 0, 26);
    expect(lifetimeVapeFreeDays(original, relapses, now)).toBe(25);
  });

  it('is DST-safe: a relapse segment spanning a fall-back day still counts once', () => {
    const original = new Date(2026, 9, 30); // Oct 30
    const relapses: Relapse[] = [{ ts: new Date(2026, 10, 3).toISOString(), trigger: 'other' }]; // Nov 3, spans Nov 1 fall-back
    const now = new Date(2026, 10, 3);
    expect(lifetimeVapeFreeDays(original, relapses, now)).toBe(4);
  });
});

describe('milestoneProgress', () => {
  it('returns 0 current and first milestone as next before any milestone is hit', () => {
    const p = milestoneProgress(0);
    expect(p.current).toBe(0);
    expect(p.next).toBe(STREAK_MILESTONES[0]);
    expect(p.progress).toBe(0);
  });

  it('computes fractional progress between two milestones', () => {
    // Between day 7 and day 14, at day 10 -> 3/7 progress.
    const p = milestoneProgress(10);
    expect(p.current).toBe(7);
    expect(p.next).toBe(14);
    expect(p.progress).toBeCloseTo(3 / 7, 5);
  });

  it('reports progress 1 with no next milestone once the ladder is cleared', () => {
    const last = STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
    const p = milestoneProgress(last + 1);
    expect(p.current).toBe(last);
    expect(p.next).toBeUndefined();
    expect(p.progress).toBe(1);
  });

  it('lands exactly on a milestone boundary', () => {
    const p = milestoneProgress(7);
    expect(p.current).toBe(7);
    expect(p.next).toBe(14);
    expect(p.progress).toBe(0);
  });
});

describe('lungStage', () => {
  it('returns stage 0 before day 1', () => {
    expect(lungStage(0)).toBe(0);
  });

  it('steps up at each staged threshold', () => {
    expect(lungStage(1)).toBe(1);
    expect(lungStage(2)).toBe(1);
    expect(lungStage(3)).toBe(3);
    expect(lungStage(6)).toBe(3);
    expect(lungStage(7)).toBe(7);
    expect(lungStage(29)).toBe(14);
    expect(lungStage(30)).toBe(30);
    expect(lungStage(90)).toBe(90);
    expect(lungStage(500)).toBe(90);
  });

  it('never returns a stage not in LUNG_STAGES', () => {
    for (let d = 0; d <= 400; d += 3) {
      expect(LUNG_STAGES).toContain(lungStage(d));
    }
  });
});
