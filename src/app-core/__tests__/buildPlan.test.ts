import { buildPlanFromAnswers } from '../buildPlan';
import { QuizAnswers } from '@/store';

describe('buildPlanFromAnswers', () => {
  it('builds a cold turkey plan with default fallbacks when answers are empty', () => {
    const fixedNow = new Date(2026, 7, 15, 12, 0, 0);
    const plan = buildPlanFromAnswers({}, fixedNow);

    expect(plan.method).toBe('cold_turkey');
    expect(plan.streakStart).toBe(fixedNow.toISOString());
    expect(plan.originalQuitDate).toBe(fixedNow.toISOString());
    expect(plan.baselinePuffsPerDay).toBe(150);
    expect(plan.vapeCostPerWeek).toBe(25);
    expect(plan.dependencyScore).toBeGreaterThanOrEqual(0);
    expect(plan.reasons).toEqual(['health']);
    expect(plan.taperWeeklyReduction).toBeUndefined();
  });

  it('builds a customized taper plan correctly', () => {
    const fixedNow = new Date(2026, 7, 15, 12, 0, 0);
    const answers: QuizAnswers = {
      method: 'taper',
      puffsPerDay: 250,
      vapeCostPerWeek: 50,
      reasons: ['money', 'freedom'],
      firstPuffOnWaking: true,
      yearsVaping: 4,
      failedQuitAttempts: 2,
      nicotineStrengthMgMl: 20,
    };

    const plan = buildPlanFromAnswers(answers, fixedNow);

    expect(plan.method).toBe('taper');
    expect(plan.baselinePuffsPerDay).toBe(250);
    expect(plan.vapeCostPerWeek).toBe(50);
    expect(plan.reasons).toEqual(['money', 'freedom']);
    expect(plan.taperWeeklyReduction).toBe(0.15); // DEFAULT_WEEKLY_REDUCTION
    expect(plan.dependencyScore).toBeGreaterThan(5); // High dependency answers
  });
});
