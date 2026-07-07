import { dependencyBand, dependencyScore } from '../dependency';

describe('dependencyScore', () => {
  it('returns 0 for the mildest possible inputs', () => {
    const score = dependencyScore({
      firstPuffOnWaking: false,
      puffsPerDay: 0,
      yearsVaping: 0,
      failedQuitAttempts: 0,
      nicotineStrengthMgMl: 0,
    });
    expect(score).toBe(0);
  });

  it('returns 10 for maxed-out (saturating) inputs', () => {
    const score = dependencyScore({
      firstPuffOnWaking: true,
      puffsPerDay: 300,
      yearsVaping: 5,
      failedQuitAttempts: 3,
      nicotineStrengthMgMl: 50,
    });
    expect(score).toBe(10);
  });

  it('saturates rather than exceeding 10 beyond the ceilings', () => {
    const score = dependencyScore({
      firstPuffOnWaking: true,
      puffsPerDay: 10_000,
      yearsVaping: 50,
      failedQuitAttempts: 99,
      nicotineStrengthMgMl: 999,
    });
    expect(score).toBe(10);
  });

  it('defaults nicotine strength to a mid-value (0.5) when omitted', () => {
    const withUnknown = dependencyScore({
      firstPuffOnWaking: false,
      puffsPerDay: 0,
      yearsVaping: 0,
      failedQuitAttempts: 0,
    });
    // 0.5 * 0.15 weight * 10 = 0.75, rounded to 1dp.
    expect(withUnknown).toBeCloseTo(0.8, 1);
  });

  it('weighs first-puff-on-waking as the single strongest predictor', () => {
    const base = { puffsPerDay: 0, yearsVaping: 0, failedQuitAttempts: 0, nicotineStrengthMgMl: 0 };
    const waking = dependencyScore({ ...base, firstPuffOnWaking: true });
    const notWaking = dependencyScore({ ...base, firstPuffOnWaking: false });
    expect(waking).toBeGreaterThan(notWaking);
    expect(waking).toBeCloseTo(3, 1); // 0.3 weight * 10
  });

  it('guards against non-finite puffsPerDay without throwing', () => {
    const score = dependencyScore({
      firstPuffOnWaking: false,
      puffsPerDay: NaN,
      yearsVaping: 0,
      failedQuitAttempts: 0,
    });
    expect(Number.isFinite(score)).toBe(true);
    expect(score).toBe(0.8); // unit(NaN) clamps to 0, same as the "unknown strength" default
  });

  it('is monotonic in puffs per day', () => {
    const base = {
      firstPuffOnWaking: false,
      yearsVaping: 0,
      failedQuitAttempts: 0,
      nicotineStrengthMgMl: 0,
    };
    const low = dependencyScore({ ...base, puffsPerDay: 50 });
    const high = dependencyScore({ ...base, puffsPerDay: 200 });
    expect(high).toBeGreaterThan(low);
  });
});

describe('dependencyBand', () => {
  it('buckets scores into low/moderate/high/severe', () => {
    expect(dependencyBand(0)).toBe('low');
    expect(dependencyBand(2.9)).toBe('low');
    expect(dependencyBand(3)).toBe('moderate');
    expect(dependencyBand(5.4)).toBe('moderate');
    expect(dependencyBand(5.5)).toBe('high');
    expect(dependencyBand(7.9)).toBe('high');
    expect(dependencyBand(8)).toBe('severe');
    expect(dependencyBand(10)).toBe('severe');
  });
});
