import {
  formatMoney,
  moneySaved,
  projectedSavings,
  savingsProjection,
  savingsRatePerMs,
} from '../money';
import { MS_PER_DAY } from '../time';

describe('savingsRatePerMs', () => {
  it('derives a per-ms rate from weekly spend', () => {
    const rate = savingsRatePerMs(70); // $10/day
    expect(rate * MS_PER_DAY).toBeCloseTo(10, 6);
  });
});

describe('moneySaved', () => {
  it('computes savings proportional to elapsed time', () => {
    const weekly = 35; // $5/day
    expect(moneySaved(weekly, MS_PER_DAY)).toBeCloseTo(5, 6);
    expect(moneySaved(weekly, MS_PER_DAY * 7)).toBeCloseTo(35, 6);
  });

  it('clamps negative elapsed time to 0', () => {
    expect(moneySaved(35, -1000)).toBe(0);
  });

  it('returns 0 for non-finite or non-positive spend (guards against NaN)', () => {
    expect(moneySaved(NaN, MS_PER_DAY)).toBe(0);
    expect(moneySaved(0, MS_PER_DAY)).toBe(0);
    expect(moneySaved(-10, MS_PER_DAY)).toBe(0);
    expect(moneySaved(Infinity, MS_PER_DAY)).toBe(0);
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

describe('formatMoney', () => {
  it('formats to 2 decimal places with thousands separators', () => {
    expect(formatMoney(1234.5)).toBe('1,234.50');
    expect(formatMoney(0)).toBe('0.00');
  });

  it('falls back to 0.00 for non-finite input rather than throwing', () => {
    expect(formatMoney(NaN)).toBe('0.00');
    expect(formatMoney(Infinity)).toBe('0.00');
  });
});
