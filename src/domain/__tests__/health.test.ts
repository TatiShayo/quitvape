import {
  calculateHealthProgress,
  calculateMilestonePercentage,
  getOverallHealthRecovery,
  HEALTH_METRICS,
} from '../health';
import { MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE } from '../time';

describe('calculateHealthProgress & calculateMilestonePercentage', () => {
  it('returns 0 for elapsed time <= 0', () => {
    expect(calculateHealthProgress(0, 1000)).toBe(0);
    expect(calculateHealthProgress(-500, 1000)).toBe(0);
    expect(calculateMilestonePercentage(0, 1000)).toBe(0);
  });

  it('returns 1 / 100% when elapsed time >= target time', () => {
    expect(calculateHealthProgress(1000, 1000)).toBe(1);
    expect(calculateHealthProgress(1500, 1000)).toBe(1);
    expect(calculateMilestonePercentage(1500, 1000)).toBe(100);
  });

  it('interpolates intermediate progress smoothly', () => {
    expect(calculateHealthProgress(500, 1000)).toBe(0.5);
    expect(calculateMilestonePercentage(500, 1000)).toBe(50);
    expect(calculateMilestonePercentage(250, 1000)).toBe(25);
    expect(calculateMilestonePercentage(333, 1000)).toBe(33.3);
  });

  it('supports custom startMs offset', () => {
    expect(calculateHealthProgress(500, 1000, 200)).toBeCloseTo(300 / 800, 4);
    expect(calculateHealthProgress(100, 1000, 200)).toBe(0);
  });

  it('handles invalid inputs gracefully without throwing', () => {
    expect(calculateHealthProgress(NaN, 1000)).toBe(0);
    expect(calculateHealthProgress(500, NaN)).toBe(1);
    expect(calculateMilestonePercentage(NaN, 1000)).toBe(0);
  });
});

describe('HEALTH_METRICS definition catalog', () => {
  it('has strictly positive targetMs and valid non-empty fields for every metric', () => {
    expect(HEALTH_METRICS.length).toBeGreaterThanOrEqual(10);
    for (const m of HEALTH_METRICS) {
      expect(m.id.length).toBeGreaterThan(0);
      expect(m.title.length).toBeGreaterThan(0);
      expect(m.description.length).toBeGreaterThan(0);
      expect(m.clinicalSource.length).toBeGreaterThan(0);
      expect(m.targetMs).toBeGreaterThan(0);
      expect(['cardiovascular', 'respiratory', 'neurological', 'sensory']).toContain(m.category);
    }
  });

  it('is monotonically sorted by targetMs ascending', () => {
    for (let i = 1; i < HEALTH_METRICS.length; i++) {
      expect(HEALTH_METRICS[i].targetMs).toBeGreaterThan(HEALTH_METRICS[i - 1].targetMs);
    }
  });
});

describe('getOverallHealthRecovery', () => {
  it('evaluates status at 0 ms (brand new quit)', () => {
    const recovery = getOverallHealthRecovery(0);
    expect(recovery.completedMilestonesCount).toBe(0);
    expect(recovery.overallScore).toBe(0);
    expect(recovery.nextMilestone?.id).toBe('heart_rate');
    expect(recovery.nextMilestone?.isCompleted).toBe(false);
  });

  it('evaluates early status at 10 minutes (0 completed milestones)', () => {
    const elapsed = 10 * MS_PER_MINUTE;
    const recovery = getOverallHealthRecovery(elapsed);

    expect(recovery.completedMilestonesCount).toBe(0);
    expect(recovery.totalMilestonesCount).toBe(HEALTH_METRICS.length);
    expect(recovery.nextMilestone?.id).toBe('heart_rate');
    expect(recovery.nextMilestone?.progress).toBe(0.5); // 10 / 20 mins
    expect(recovery.overallScore).toBeGreaterThan(0);
    expect(recovery.overallScore).toBeLessThan(10);
  });

  it('evaluates status at 24 hours (heart_rate, blood_oxygen, nicotine_expulsion unlocked)', () => {
    const elapsed = 24 * MS_PER_HOUR;
    const recovery = getOverallHealthRecovery(elapsed);

    expect(recovery.completedMilestonesCount).toBe(3);
    const heartRate = recovery.milestones.find((m) => m.id === 'heart_rate');
    const oxygen = recovery.milestones.find((m) => m.id === 'blood_oxygen');
    const nicotine = recovery.milestones.find((m) => m.id === 'nicotine_expulsion');
    const tasteSmell = recovery.milestones.find((m) => m.id === 'taste_and_smell');

    expect(heartRate?.isCompleted).toBe(true);
    expect(oxygen?.isCompleted).toBe(true);
    expect(nicotine?.isCompleted).toBe(true);
    expect(tasteSmell?.isCompleted).toBe(false);
    expect(tasteSmell?.percentage).toBe(50); // 24h of 48h
    expect(recovery.nextMilestone?.id).toBe('taste_and_smell');
  });

  it('evaluates status at 1 month (30 days)', () => {
    const elapsed = 30 * MS_PER_DAY;
    const recovery = getOverallHealthRecovery(elapsed);

    const cilia = recovery.milestones.find((m) => m.id === 'lung_cilia_regrowth');
    const reset = recovery.milestones.find((m) => m.id === 'craving_receptor_reset');

    expect(cilia?.isCompleted).toBe(true);
    expect(reset?.isCompleted).toBe(false);
    expect(recovery.nextMilestone?.id).toBe('craving_receptor_reset');
  });

  it('evaluates status at 1 year (365 days)', () => {
    const elapsed = 365 * MS_PER_DAY;
    const recovery = getOverallHealthRecovery(elapsed);

    const cardiacRisk = recovery.milestones.find((m) => m.id === 'cardiac_risk_halved');
    const strokeRisk = recovery.milestones.find((m) => m.id === 'stroke_risk_baseline');

    expect(cardiacRisk?.isCompleted).toBe(true);
    expect(strokeRisk?.isCompleted).toBe(false); // 5-year target
    expect(recovery.nextMilestone?.id).toBe('stroke_risk_baseline');
  });

  it('evaluates 100% completion beyond 5 years', () => {
    const elapsed = 6 * 365 * MS_PER_DAY;
    const recovery = getOverallHealthRecovery(elapsed);

    expect(recovery.completedMilestonesCount).toBe(HEALTH_METRICS.length);
    expect(recovery.nextMilestone).toBeNull();
    expect(recovery.overallScore).toBe(100);
  });

  it('calculates category breakdown scores accurately', () => {
    const elapsed = 2 * MS_PER_DAY; // 48 hours
    const recovery = getOverallHealthRecovery(elapsed);

    expect(recovery.categoryScores.sensory.completedCount).toBe(1); // taste_and_smell is 48h
    expect(recovery.categoryScores.sensory.score).toBe(100);
    expect(recovery.categoryScores.neurological.completedCount).toBe(1); // nicotine_expulsion is 24h
    expect(recovery.categoryScores.cardiovascular.completedCount).toBe(2); // heart_rate and blood_oxygen
  });

  it('handles negative or NaN elapsed ms gracefully', () => {
    const neg = getOverallHealthRecovery(-5000);
    expect(neg.completedMilestonesCount).toBe(0);
    expect(neg.overallScore).toBe(0);

    const nanRec = getOverallHealthRecovery(NaN);
    expect(nanRec.completedMilestonesCount).toBe(0);
    expect(nanRec.overallScore).toBe(0);
  });
});
