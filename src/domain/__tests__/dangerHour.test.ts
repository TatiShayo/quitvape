import { dangerHourPingTime, detectDangerHour, DANGER_HOUR_LEAD_MINUTES } from '../dangerHour';
import { CravingEvent } from '../types';

function craving(hour: number, minute = 0, day = 5): CravingEvent {
  const d = new Date(2026, 0, day, hour, minute, 0);
  return { ts: d.toISOString(), intensity: 3, trigger: 'stress', resisted: true };
}

describe('detectDangerHour', () => {
  it('returns undefined with fewer than 3 cravings logged', () => {
    expect(detectDangerHour([])).toBeUndefined();
    expect(detectDangerHour([craving(21), craving(22)])).toBeUndefined();
  });

  it('returns undefined when cravings are spread with no repeated peak hour', () => {
    expect(detectDangerHour([craving(9), craving(14), craving(20)])).toBeUndefined();
  });

  it('detects the hour with the most logged cravings (BUILD_PROMPT 9-11pm example)', () => {
    const cravings = [craving(21, 5), craving(21, 40), craving(21, 50), craving(10, 0)];
    expect(detectDangerHour(cravings)).toBe(21);
  });

  it('detects peak hour across multiple days', () => {
    const cravings = [
      craving(15, 10, 1),
      craving(15, 30, 2),
      craving(15, 45, 3),
      craving(10, 0, 1),
    ];
    expect(detectDangerHour(cravings)).toBe(15);
  });

  it('ignores unparseable timestamps without throwing', () => {
    const cravings: CravingEvent[] = [
      craving(21),
      craving(21),
      { ts: 'not-a-date', intensity: 2, trigger: 'other', resisted: true },
    ];
    expect(detectDangerHour(cravings)).toBe(21);
  });
});

describe('dangerHourPingTime', () => {
  it('subtracts the lead window from the danger hour (BUILD_PROMPT: 9pm peak -> ~8:45pm ping)', () => {
    expect(dangerHourPingTime(21)).toEqual({ hour: 20, minute: 45 });
    expect(DANGER_HOUR_LEAD_MINUTES).toBe(15);
  });

  it('wraps around midnight correctly', () => {
    expect(dangerHourPingTime(0)).toEqual({ hour: 23, minute: 45 });
    expect(dangerHourPingTime(1)).toEqual({ hour: 0, minute: 45 });
    expect(dangerHourPingTime(12)).toEqual({ hour: 11, minute: 45 });
  });
});
