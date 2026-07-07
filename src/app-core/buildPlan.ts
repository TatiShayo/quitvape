/**
 * Builds a committed QuitPlan from the onboarding quiz answers. Applies sane defaults
 * for any field the (currently placeholder) quiz hasn't collected yet, so the flow is
 * end-to-end walkable in milestone 1 and gets richer as the real quiz lands.
 */
import { QuitPlan } from '@/domain/types';
import { dependencyScore } from '@/domain/dependency';
import { DEFAULT_WEEKLY_REDUCTION } from '@/domain/taper';
import { QuizAnswers } from '@/store';

export function buildPlanFromAnswers(answers: QuizAnswers, now: Date = new Date()): QuitPlan {
  const nowIso = now.toISOString();
  const method = answers.method ?? 'cold_turkey';
  const puffsPerDay = answers.puffsPerDay ?? 150;
  const vapeCostPerWeek = answers.vapeCostPerWeek ?? 25;

  const score = dependencyScore({
    firstPuffOnWaking: answers.firstPuffOnWaking ?? false,
    puffsPerDay,
    yearsVaping: answers.yearsVaping ?? 2,
    failedQuitAttempts: answers.failedQuitAttempts ?? 1,
    nicotineStrengthMgMl: answers.nicotineStrengthMgMl,
  });

  return {
    method,
    streakStart: nowIso,
    originalQuitDate: nowIso,
    baselinePuffsPerDay: puffsPerDay,
    vapeCostPerWeek,
    dependencyScore: score,
    reasons: answers.reasons ?? ['health'],
    taperWeeklyReduction: method === 'taper' ? DEFAULT_WEEKLY_REDUCTION : undefined,
  };
}
