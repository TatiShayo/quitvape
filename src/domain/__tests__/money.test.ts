import {
  calculateDailySpend,
  calculateDailySpendFromUnits,
  calculateWeeklySpendFromUnits,
  estimateDaysToSavingsGoal,
  formatCurrency,
  formatMoney,
  moneySaved,
  projectedSavings,
  SAVINGS_GOAL_PRESETS,
  savingsGoalProgress,
  savingsProjection,
  savingsRatePerMs,
} from '../money';
import { MS_PER_DAY } from '../time';

describe('savingsRatePerMs', () => {
  it('derives a per-ms rate from weekly spend', () => {
    const rate = savingsRatePerMs(70); // $10/day
    expect(rate * MS_PER_DAY).toBeCloseTo(10, 6);
  });

  it('returns 0 for negative or invalid spend', () => {
    expect(savingsRatePerMs(-10)).toBe(0);
    expect(savingsRatePerMs(0)).toBe(0);
    expect(savingsRatePerMs(NaN)).toBe(0);
    expect(savingsRatePerMs(Infinity)).toBe(0);
  });
});

describe('calculateDailySpend & Unit math', () => {
  it('computes daily spend from weekly spend', () => {
    expect(calculateDailySpend(70)).toBeCloseTo(10, 6);
    expect(calculateDailySpend(35)).toBeCloseTo(5, 6);
    expect(calculateDailySpend(0)).toBe(0);
    expect(calculateDailySpend(-20)).toBe(0);
    expect(calculateDailySpend(NaN)).toBe(0);
  });

  it('computes weekly spend from units (e.g. $15/disposable * 2 disposables/week)', () => {
    expect(calculateWeeklySpendFromUnits(15, 2)).toBe(30);
    expect(calculateWeeklySpendFromUnits(0, 5)).toBe(0);
    expect(calculateWeeklySpendFromUnits(-10, 5)).toBe(0);
    expect(calculateWeeklySpendFromUnits(10, -5)).toBe(0);
    expect(calculateWeeklySpendFromUnits(NaN, 5)).toBe(0);
  });

  it('computes daily spend from unit cost and units/day', () => {
    expect(calculateDailySpendFromUnits(6, 1)).toBe(6);
    expect(calculateDailySpendFromUnits(10, 0.5)).toBe(5);
    expect(calculateDailySpendFromUnits(-5, 2)).toBe(0);
    expect(calculateDailySpendFromUnits(5, -2)).toBe(0);
  });
});

describe('moneySaved', () => {
  it('computes savings proportional to elapsed time', () => {
    const weekly = 35; // $5/day
    expect(moneySaved(weekly, MS_PER_DAY)).toBeCloseTo(5, 6);
    expect(moneySaved(weekly, MS_PER_DAY * 7)).toBeCloseTo(35, 6);
    expect(moneySaved(weekly, MS_PER_DAY * 30)).toBeCloseTo(150, 6);
  });

  it('clamps negative elapsed time to 0', () => {
    expect(moneySaved(35, -1000)).toBe(0);
    expect(moneySaved(35, -999999)).toBe(0);
  });

  it('returns 0 for non-finite or non-positive spend (guards against NaN)', () => {
    expect(moneySaved(NaN, MS_PER_DAY)).toBe(0);
    expect(moneySaved(0, MS_PER_DAY)).toBe(0);
    expect(moneySaved(-10, MS_PER_DAY)).toBe(0);
    expect(moneySaved(Infinity, MS_PER_DAY)).toBe(0);
    expect(moneySaved(-Infinity, MS_PER_DAY)).toBe(0);
  });

  it('moves continuously with elapsed ms (the odometer must tick every second)', () => {
    const weekly = 70;
    const oneSecond = moneySaved(weekly, 1000);
    const twoSeconds = moneySaved(weekly, 2000);
    expect(twoSeconds).toBeCloseTo(oneSecond * 2, 6);
    expect(oneSecond).toBeGreaterThan(0);
  });
});

describe('projectedSavings / savingsProjection', () => {
  it('projects savings at N days from weekly spend', () => {
    expect(projectedSavings(70, 7)).toBeCloseTo(70, 6);
    expect(projectedSavings(70, 0)).toBe(0);
    expect(projectedSavings(70, 365)).toBeCloseTo((70 / 7) * 365, 6);
  });

  it('clamps negative day counts to 0', () => {
    expect(projectedSavings(70, -5)).toBe(0);
  });

  it('computes 1yr/5yr projection card values', () => {
    const proj = savingsProjection(35); // $5/day
    expect(proj.oneYear).toBeCloseTo(5 * 365, 6);
    expect(proj.fiveYear).toBeCloseTo(5 * 365 * 5, 6);
  });
});

describe('savingsGoalProgress', () => {
  it('calculates 50% progress on a $200 goal when $100 saved', () => {
    const res = savingsGoalProgress(100, 200);
    expect(res.progress).toBe(0.5);
    expect(res.percentage).toBe(50);
    expect(res.remaining).toBe(100);
    expect(res.reached).toBe(false);
  });

  it('handles goal reached and exceeded', () => {
    const res = savingsGoalProgress(250, 200);
    expect(res.progress).toBe(1);
    expect(res.percentage).toBe(100);
    expect(res.remaining).toBe(0);
    expect(res.reached).toBe(true);
  });

  it('handles exact target equality', () => {
    const res = savingsGoalProgress(100, 100);
    expect(res.progress).toBe(1);
    expect(res.percentage).toBe(100);
    expect(res.remaining).toBe(0);
    expect(res.reached).toBe(true);
  });

  it('handles zero target gracefully', () => {
    const res = savingsGoalProgress(10, 0);
    expect(res.progress).toBe(1);
    expect(res.percentage).toBe(100);
    expect(res.remaining).toBe(0);
    expect(res.reached).toBe(true);
  });

  it('handles negative or NaN saved amount', () => {
    const res = savingsGoalProgress(-50, 100);
    expect(res.currentAmount).toBe(0);
    expect(res.progress).toBe(0);
    expect(res.remaining).toBe(100);
    expect(res.reached).toBe(false);

    const nanRes = savingsGoalProgress(NaN, 100);
    expect(nanRes.currentAmount).toBe(0);
    expect(nanRes.progress).toBe(0);
  });
});

describe('estimateDaysToSavingsGoal', () => {
  it('estimates whole days until goal is met', () => {
    // $100 goal, $10/day spend, $0 saved -> 10 days
    expect(estimateDaysToSavingsGoal(100, 10, 0)).toBe(10);
    // $100 goal, $10/day spend, $55 saved -> $45 remaining -> ceil(4.5) = 5 days
    expect(estimateDaysToSavingsGoal(100, 10, 55)).toBe(5);
  });

  it('returns 0 if already reached or exceeded', () => {
    expect(estimateDaysToSavingsGoal(100, 10, 150)).toBe(0);
    expect(estimateDaysToSavingsGoal(100, 10, 100)).toBe(0);
  });

  it('returns Infinity if daily spend is 0 or negative or NaN', () => {
    expect(estimateDaysToSavingsGoal(100, 0, 0)).toBe(Infinity);
    expect(estimateDaysToSavingsGoal(100, -5, 0)).toBe(Infinity);
    expect(estimateDaysToSavingsGoal(100, NaN, 0)).toBe(Infinity);
  });
});

describe('formatCurrency & formatMoney', () => {
  it('formats standard US dollars with symbol', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('supports custom currency symbols and decimals', () => {
    expect(formatCurrency(1234.56, { currencySymbol: '£', decimals: 0 })).toBe('£1,235');
    expect(formatCurrency(50, { currencySymbol: '€', decimals: 2 })).toBe('€50.00');
    expect(formatCurrency(7500, { currencySymbol: '¥', decimals: 0 })).toBe('¥7,500');
  });

  it('formatMoney formats to 2 decimal places with thousands separators', () => {
    expect(formatMoney(1234.5)).toBe('1,234.50');
    expect(formatMoney(0)).toBe('0.00');
    expect(formatMoney(1000000)).toBe('1,000,000.00');
  });

  it('falls back to 0.00 for non-finite input rather than throwing', () => {
    expect(formatMoney(NaN)).toBe('0.00');
    expect(formatMoney(Infinity)).toBe('0.00');
    expect(formatMoney(-Infinity)).toBe('0.00');
  });
});

describe('SAVINGS_GOAL_PRESETS', () => {
  it('has valid target amounts and names for all presets', () => {
    expect(SAVINGS_GOAL_PRESETS.length).toBeGreaterThanOrEqual(4);
    for (const preset of SAVINGS_GOAL_PRESETS) {
      expect(preset.targetAmount).toBeGreaterThan(0);
      expect(preset.name.length).toBeGreaterThan(0);
      expect(typeof preset.id).toBe('string');
    }
  });
});
