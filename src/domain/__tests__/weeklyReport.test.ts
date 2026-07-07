import { buildWeeklyReport } from '../weeklyReport';
import { CheckIn, CravingEvent } from '../types';

describe('buildWeeklyReport', () => {
  const now = new Date(2026, 0, 15, 12, 0, 0); // Thursday

  it('returns 7 days ending on now (inclusive)', () => {
    const report = buildWeeklyReport([], [], now);
    expect(report.days).toHaveLength(7);
    expect(report.days[6]).toBe('2026-01-15');
    expect(report.days[0]).toBe('2026-01-09');
  });

  it('counts resisted vs slipped cravings within the trailing 7-day window', () => {
    const cravings: CravingEvent[] = [
      { ts: new Date(2026, 0, 14).toISOString(), intensity: 3, trigger: 'stress', resisted: true },
      { ts: new Date(2026, 0, 13).toISOString(), intensity: 4, trigger: 'social', resisted: false },
      // Outside the window (8 days ago)
      { ts: new Date(2026, 0, 6).toISOString(), intensity: 2, trigger: 'boredom', resisted: true },
    ];
    const report = buildWeeklyReport(cravings, [], now);
    expect(report.cravingsResisted).toBe(1);
    expect(report.cravingsSlipped).toBe(1);
  });

  it('computes average mood only from check-ins inside the 7-day window', () => {
    const checkIns: CheckIn[] = [
      { date: '2026-01-14', mood: 4 },
      { date: '2026-01-12', mood: 2 },
      { date: '2025-12-01', mood: 5 }, // way outside window, must be excluded
    ];
    const report = buildWeeklyReport([], checkIns, now);
    expect(report.checkInCount).toBe(2);
    expect(report.averageMood).toBe(3);
  });

  it('returns undefined average mood with zero check-ins', () => {
    const report = buildWeeklyReport([], [], now);
    expect(report.averageMood).toBeUndefined();
    expect(report.checkInCount).toBe(0);
  });

  it('maps moodByDay to the correct day index, leaving gaps undefined', () => {
    const checkIns: CheckIn[] = [{ date: '2026-01-15', mood: 5 }];
    const report = buildWeeklyReport([], checkIns, now);
    expect(report.moodByDay[6]).toBe(5);
    expect(report.moodByDay[0]).toBeUndefined();
  });
});
