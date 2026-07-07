/**
 * Dependency score (0-10) computed from onboarding quiz answers. Weighted sum, then
 * normalized. Drives the animated gauge on the "Your dependency score" screen and the
 * paywall personalization. Deterministic + pure for unit testing.
 *
 * Signals (each 0-1 after normalization), weighted by clinical relevance to nicotine
 * dependence (time-to-first-use and daily volume weigh most, echoing Fagerström):
 *  - firstPuffOnWaking (within ~30 min of waking) -> strongest single predictor
 *  - puffsPerDay -> volume
 *  - yearsVaping -> chronicity
 *  - failedQuitAttempts -> entrenchment
 *  - nicotineStrength (mg/mL bucket) -> potency
 */
export interface DependencyInputs {
  /** True if they vape within ~30 min of waking. */
  firstPuffOnWaking: boolean;
  /** Self-reported puffs per day. */
  puffsPerDay: number;
  /** Years vaping. */
  yearsVaping: number;
  /** Number of prior failed quit attempts. */
  failedQuitAttempts: number;
  /** Nicotine strength in mg/mL (e.g. 3, 6, 12, 20, 50). Optional. */
  nicotineStrengthMgMl?: number;
}

const WEIGHTS = {
  firstPuffOnWaking: 0.3,
  puffsPerDay: 0.28,
  yearsVaping: 0.15,
  failedQuitAttempts: 0.12,
  nicotineStrength: 0.15,
} as const;

/** Clamp x to [0,1]. */
function unit(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

export function dependencyScore(inputs: DependencyInputs): number {
  const waking = inputs.firstPuffOnWaking ? 1 : 0;
  // 300 puffs/day is a heavy-use ceiling for normalization.
  const puffs = unit(inputs.puffsPerDay / 300);
  // 5+ years saturates the chronicity signal.
  const years = unit(inputs.yearsVaping / 5);
  // 3+ prior attempts saturates entrenchment.
  const attempts = unit(inputs.failedQuitAttempts / 3);
  // 50 mg/mL (salt nic max) saturates potency; default mid if unknown.
  const strength =
    inputs.nicotineStrengthMgMl === undefined
      ? 0.5
      : unit(inputs.nicotineStrengthMgMl / 50);

  const raw =
    waking * WEIGHTS.firstPuffOnWaking +
    puffs * WEIGHTS.puffsPerDay +
    years * WEIGHTS.yearsVaping +
    attempts * WEIGHTS.failedQuitAttempts +
    strength * WEIGHTS.nicotineStrength;

  // Weights sum to 1, so raw is already 0..1. Scale to 0..10, one decimal.
  return Math.round(raw * 10 * 10) / 10;
}

/** Brutal-but-kind band label for the score. */
export function dependencyBand(score: number): 'low' | 'moderate' | 'high' | 'severe' {
  if (score < 3) return 'low';
  if (score < 5.5) return 'moderate';
  if (score < 8) return 'high';
  return 'severe';
}
