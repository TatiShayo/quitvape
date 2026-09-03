/**
 * Money-saved math. Live-ticking, so it must be smooth AND correct at any instant.
 * Savings accrue on ELAPSED time (not calendar days) so the odometer moves every
 * second. Based on the user's baseline weekly spend or itemized pack/pod costs.
 */
import { MS_PER_DAY } from './time';

const DAYS_PER_WEEK = 7;

/** Money saved per millisecond given a weekly spend. */
export function savingsRatePerMs(vapeCostPerWeek: number): number {
  if (!Number.isFinite(vapeCostPerWeek) || vapeCostPerWeek <= 0) return 0;
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

/** Daily spend derived from weekly spend. */
export function calculateDailySpend(vapeCostPerWeek: number): number {
  if (!Number.isFinite(vapeCostPerWeek) || vapeCostPerWeek <= 0) return 0;
  return vapeCostPerWeek / DAYS_PER_WEEK;
}

/** Weekly spend derived from unit cost (e.g. per pod/disposable) and units per week. */
export function calculateWeeklySpendFromUnits(unitCost: number, unitsPerWeek: number): number {
  if (!Number.isFinite(unitCost) || unitCost <= 0 || !Number.isFinite(unitsPerWeek) || unitsPerWeek <= 0) {
    return 0;
  }
  return unitCost * unitsPerWeek;
}

/** Daily spend derived from unit cost (e.g. per pod/disposable) and units per day. */
export function calculateDailySpendFromUnits(unitCost: number, unitsPerDay: number): number {
  if (!Number.isFinite(unitCost) || unitCost <= 0 || !Number.isFinite(unitsPerDay) || unitsPerDay <= 0) {
    return 0;
  }
  return unitCost * unitsPerDay;
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

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  icon?: string;
}

export interface SavingsGoalProgress {
  targetAmount: number;
  currentAmount: number;
  /** 0..1 clamped progress ratio */
  progress: number;
  /** Progress percentage 0..100 clamped */
  percentage: number;
  remaining: number;
  reached: boolean;
}

export const SAVINGS_GOAL_PRESETS: SavingsGoal[] = [
  { id: 'dinner', name: 'Nice Dinner Out', targetAmount: 60 },
  { id: 'sneakers', name: 'New Running Shoes', targetAmount: 140 },
  { id: 'concert', name: 'Concert Ticket', targetAmount: 200 },
  { id: 'weekend', name: 'Weekend Road Trip', targetAmount: 450 },
  { id: 'gadget', name: 'New Smartwatch / Tablet', targetAmount: 800 },
  { id: 'vacation', name: 'International Vacation', targetAmount: 2500 },
];

/** Evaluates progress toward a specific financial milestone/goal. */
export function savingsGoalProgress(totalSaved: number, goalAmount: number): SavingsGoalProgress {
  const current = Math.max(0, Number.isFinite(totalSaved) ? totalSaved : 0);
  const target = Math.max(0, Number.isFinite(goalAmount) ? goalAmount : 0);

  if (target === 0) {
    return {
      targetAmount: 0,
      currentAmount: current,
      progress: 1,
      percentage: 100,
      remaining: 0,
      reached: true,
    };
  }

  const progress = Math.min(1, Math.max(0, current / target));
  const percentage = Math.round(progress * 1000) / 10;
  const remaining = Math.max(0, target - current);
  const reached = current >= target;

  return {
    targetAmount: target,
    currentAmount: current,
    progress,
    percentage,
    remaining,
    reached,
  };
}

/** Estimates the number of whole days until a savings goal is reached. */
export function estimateDaysToSavingsGoal(
  goalAmount: number,
  dailySpend: number,
  alreadySaved = 0,
): number {
  if (!Number.isFinite(dailySpend) || dailySpend <= 0) return Infinity;
  const target = Math.max(0, goalAmount);
  const current = Math.max(0, alreadySaved);
  const remaining = Math.max(0, target - current);
  if (remaining === 0) return 0;
  return Math.ceil(remaining / dailySpend);
}

export interface FormatCurrencyOptions {
  currencyCode?: string;
  currencySymbol?: string;
  decimals?: number;
  locale?: string;
}

/** Formats a money amount with optional currency symbol/code and custom decimals. */
export function formatCurrency(amount: number, options?: FormatCurrencyOptions): string {
  const num = Number.isFinite(amount) ? amount : 0;
  const decimals = options?.decimals ?? 2;
  const locale = options?.locale ?? 'en-US';
  const symbol = options?.currencySymbol ?? '$';

  const formattedNum = num.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${symbol}${formattedNum}`;
}

/** Format a money amount for display (no currency symbol; caller adds locale symbol). */
export function formatMoney(amount: number): string {
  return (Number.isFinite(amount) ? amount : 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
