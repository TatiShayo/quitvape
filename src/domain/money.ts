/**
 * Money-saved math. Live-ticking, so it must be smooth AND correct at any instant.
 * Savings accrue on ELAPSED time (not calendar days) so the odometer moves every
 * second. Based on the user's baseline weekly spend (BUILD_PROMPT data model).
 */
import { MS_PER_DAY } from './time';

const DAYS_PER_WEEK = 7;

/** Money saved per millisecond given a weekly spend. */
export function savingsRatePerMs(vapeCostPerWeek: number): number {
  const perDay = vapeCostPerWeek / DAYS_PER_WEEK;
  return perDay / MS_PER_DAY;
}

/**
 * Money saved over an elapsed period. Negative elapsed clamps to 0. Result is a raw
 * float; format at the display edge (2 dp, tabular). Guards against NaN/negative spend.
 */
export function moneySaved(vapeCostPerWeek: number, elapsedMs: number): number {
  if (!Number.isFinite(vapeCostPerWeek) || vapeCostPerWeek <= 0) return 0;
  const ms = Math.max(0, elapsedMs);
  return savingsRatePerMs(vapeCostPerWeek) * ms;
}

/** Projected savings at N days, for the onboarding savings chart. */
export function projectedSavings(vapeCostPerWeek: number, days: number): number {
  return moneySaved(vapeCostPerWeek, Math.max(0, days) * MS_PER_DAY);
}

/** Convenience for the 1yr / 5yr projection cards. */
export function savingsProjection(vapeCostPerWeek: number) {
  return {
    oneYear: projectedSavings(vapeCostPerWeek, 365),
    fiveYear: projectedSavings(vapeCostPerWeek, 365 * 5),
  };
}

/** Format a money amount for display (no currency symbol; caller adds locale symbol). */
export function formatMoney(amount: number): string {
  return (Number.isFinite(amount) ? amount : 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
