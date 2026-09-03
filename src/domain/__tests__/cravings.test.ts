import {
  analyzeCravingTriggers,
  categorizeIntensity,
  COPING_TECHNIQUES,
  normalizeIntensity,
  recommendCopingMechanism,
} from '../cravings';
import { CravingEvent } from '../types';

describe('normalizeIntensity & categorizeIntensity', () => {
  it('normalizes 1-5 scale scores into 1-10 accurately', () => {
    expect(normalizeIntensity(1, 5)).toEqual({ score1to5: 1, score1to10: 2 });
    expect(normalizeIntensity(3, 5)).toEqual({ score1to5: 3, score1to10: 6 });
    expect(normalizeIntensity(5, 5)).toEqual({ score1to5: 5, score1to10: 10 });
  });

  it('normalizes 1-10 scale scores into 1-5 accurately', () => {
    expect(normalizeIntensity(2, 10)).toEqual({ score1to5: 1, score1to10: 2 });
    expect(normalizeIntensity(7, 10)).toEqual({ score1to5: 4, score1to10: 7 });
    expect(normalizeIntensity(10, 10)).toEqual({ score1to5: 5, score1to10: 10 });
  });

  it('clamps out-of-range values and handles NaN', () => {
    expect(normalizeIntensity(0, 5)).toEqual({ score1to5: 1, score1to10: 2 });
    expect(normalizeIntensity(12, 5)).toEqual({ score1to5: 5, score1to10: 10 });
    expect(normalizeIntensity(NaN, 5)).toEqual({ score1to5: 3, score1to10: 6 });
  });

  it('categorizes intensity into clinical levels with auto scale detection', () => {
    expect(categorizeIntensity(1, 5)).toBe('mild'); // 2/10
    expect(categorizeIntensity(2, 5)).toBe('moderate'); // 4/10
    expect(categorizeIntensity(3, 5)).toBe('moderate'); // 6/10
    expect(categorizeIntensity(4, 5)).toBe('strong'); // 8/10
    expect(categorizeIntensity(5, 5)).toBe('severe'); // 10/10

    // Auto-detects 1-10 scale when score > 5
    expect(categorizeIntensity(8)).toBe('strong');
    expect(categorizeIntensity(10)).toBe('severe');
    expect(categorizeIntensity(2)).toBe('moderate');
  });
});

describe('recommendCopingMechanism', () => {
  it('recommends cold dive shock for severe acute cravings (intensity 5/5 or 10/10)', () => {
    const rec5 = recommendCopingMechanism('stress', 5);
    expect(rec5.primaryTechnique.id).toBe(COPING_TECHNIQUES.cold_dive.id);
    expect(rec5.urgencyLevel).toBe('severe');

    const rec10 = recommendCopingMechanism('stress', 10);
    expect(rec10.primaryTechnique.id).toBe(COPING_TECHNIQUES.cold_dive.id);
    expect(rec10.urgencyLevel).toBe('severe');
  });

  it('recommends 4-7-8 breathing for daytime stress', () => {
    const rec = recommendCopingMechanism('stress', 3, { isEvening: false });
    expect(rec.primaryTechnique.id).toBe(COPING_TECHNIQUES.breathing_478.id);
    expect(rec.alternativeTechnique.id).toBe(COPING_TECHNIQUES.box_breathing.id);
  });

  it('recommends progressive muscle relaxation for evening stress', () => {
    const rec = recommendCopingMechanism('stress', 3, { isEvening: true });
    expect(rec.primaryTechnique.id).toBe(COPING_TECHNIQUES.progressive_relaxation.id);
  });

  it('recommends social boundary plan for social and drinking triggers', () => {
    const socialRec = recommendCopingMechanism('social', 3);
    const drinkRec = recommendCopingMechanism('drinking', 3);
    expect(socialRec.primaryTechnique.id).toBe(COPING_TECHNIQUES.social_boundary_plan.id);
    expect(drinkRec.primaryTechnique.id).toBe(COPING_TECHNIQUES.social_boundary_plan.id);
  });

  it('recommends 10-minute delay and power walk for boredom triggers', () => {
    const rec = recommendCopingMechanism('boredom', 2);
    expect(rec.primaryTechnique.id).toBe(COPING_TECHNIQUES.delay_ten_minutes.id);
    expect(rec.alternativeTechnique.id).toBe(COPING_TECHNIQUES.power_walk.id);
  });

  it('recommends 5-4-3-2-1 grounding for other/general triggers', () => {
    const rec = recommendCopingMechanism('other', 3);
    expect(rec.primaryTechnique.id).toBe(COPING_TECHNIQUES.grounding_54321.id);
  });
});

describe('COPING_TECHNIQUES catalog', () => {
  it('contains valid durations, non-empty steps, and categories', () => {
    const techniques = Object.values(COPING_TECHNIQUES);
    expect(techniques.length).toBeGreaterThanOrEqual(8);
    for (const tech of techniques) {
      expect(tech.id.length).toBeGreaterThan(0);
      expect(tech.name.length).toBeGreaterThan(0);
      expect(tech.durationMinutes).toBeGreaterThan(0);
      expect(tech.steps.length).toBeGreaterThanOrEqual(2);
      expect(['breathing', 'physiological', 'cognitive', 'behavioral', 'social']).toContain(
        tech.category,
      );
    }
  });
});

describe('analyzeCravingTriggers', () => {
  it('handles empty craving log gracefully', () => {
    const res = analyzeCravingTriggers([]);
    expect(res.totalCravings).toBe(0);
    expect(res.resistedTotal).toBe(0);
    expect(res.overallResistanceRate).toBe(0);
    expect(res.dominantTrigger).toBeNull();
    expect(res.peakHour).toBeNull();
  });

  it('analyzes trigger breakdown and identifies dominant trigger', () => {
    const cravings: CravingEvent[] = [
      { ts: new Date(2026, 7, 14, 10, 0, 0).toISOString(), intensity: 3, trigger: 'stress', resisted: true },
      { ts: new Date(2026, 7, 14, 11, 0, 0).toISOString(), intensity: 4, trigger: 'stress', resisted: true },
      { ts: new Date(2026, 7, 14, 14, 0, 0).toISOString(), intensity: 2, trigger: 'boredom', resisted: false },
      { ts: new Date(2026, 7, 14, 20, 0, 0).toISOString(), intensity: 5, trigger: 'drinking', resisted: false },
      { ts: new Date(2026, 7, 14, 20, 30, 0).toISOString(), intensity: 4, trigger: 'drinking', resisted: true },
      { ts: new Date(2026, 7, 14, 20, 45, 0).toISOString(), intensity: 5, trigger: 'drinking', resisted: true },
    ];

    const res = analyzeCravingTriggers(cravings);

    expect(res.totalCravings).toBe(6);
    expect(res.resistedTotal).toBe(4);
    expect(res.overallResistanceRate).toBeCloseTo(66.7, 1);
    expect(res.peakIntensity).toBe(5);
    expect(res.dominantTrigger).toBe('drinking'); // 3 drinking cravings

    const stressStat = res.triggerBreakdown.stress;
    expect(stressStat.count).toBe(2);
    expect(stressStat.resistedCount).toBe(2);
    expect(stressStat.resistedRate).toBe(100);
    expect(stressStat.avgIntensity).toBe(3.5);

    const drinkStat = res.triggerBreakdown.drinking;
    expect(drinkStat.count).toBe(3);
    expect(drinkStat.resistedCount).toBe(2);
    expect(drinkStat.resistedRate).toBeCloseTo(66.7, 1);

    // Peak hour is 20 (3 cravings at 20:xx)
    expect(res.peakHour).toBe(20);
    expect(res.hourlyDistribution[20]).toBe(3);
  });

  it('filters out malformed craving records with invalid timestamps', () => {
    const mixed = [
      { ts: 'invalid-date', intensity: 3, trigger: 'stress', resisted: true },
      { ts: '2026-08-14T12:00:00.000Z', intensity: 2, trigger: 'boredom', resisted: true },
    ] as CravingEvent[];

    const res = analyzeCravingTriggers(mixed);
    expect(res.totalCravings).toBe(1);
    expect(res.triggerBreakdown.boredom.count).toBe(1);
  });
});
