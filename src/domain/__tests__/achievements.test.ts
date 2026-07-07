import { evaluateUnlockedAchievements, newlyUnlocked } from '../achievements';

describe('evaluateUnlockedAchievements', () => {
  it('unlocks nothing at zero state', () => {
    expect(
      evaluateUnlockedAchievements({ streakDays: 0, cravingsResistedCount: 0, moneySaved: 0 }),
    ).toEqual([]);
  });

  it('unlocks streak milestones cumulatively', () => {
    expect(
      evaluateUnlockedAchievements({ streakDays: 14, cravingsResistedCount: 0, moneySaved: 0 }),
    ).toEqual(['day_1', 'hour_72', 'week_1', 'week_2']);
  });

  it('unlocks all streak tiers at 30+ days', () => {
    const result = evaluateUnlockedAchievements({
      streakDays: 45,
      cravingsResistedCount: 0,
      moneySaved: 0,
    });
    expect(result).toEqual(['day_1', 'hour_72', 'week_1', 'week_2', 'month_1']);
  });

  it('unlocks craving-resisted and money milestones independently of streak', () => {
    const result = evaluateUnlockedAchievements({
      streakDays: 0,
      cravingsResistedCount: 100,
      moneySaved: 150,
    });
    expect(result).toContain('puffs_100_resisted');
    expect(result).toContain('saved_100');
    expect(result).not.toContain('day_1');
  });

  it('does not unlock below thresholds (boundary check)', () => {
    const result = evaluateUnlockedAchievements({
      streakDays: 6,
      cravingsResistedCount: 99,
      moneySaved: 99.99,
    });
    expect(result).toEqual(['day_1', 'hour_72']);
  });
});

describe('newlyUnlocked', () => {
  it('returns only ids not already recorded', () => {
    const result = newlyUnlocked(
      { streakDays: 7, cravingsResistedCount: 0, moneySaved: 0 },
      ['day_1', 'hour_72'],
    );
    expect(result).toEqual(['week_1']);
  });

  it('returns empty once everything eligible is already recorded', () => {
    const result = newlyUnlocked(
      { streakDays: 7, cravingsResistedCount: 0, moneySaved: 0 },
      ['day_1', 'hour_72', 'week_1'],
    );
    expect(result).toEqual([]);
  });

  it('is idempotent across repeated calls with the growing unlocked list', () => {
    let unlocked: string[] = [];
    const input = { streakDays: 30, cravingsResistedCount: 0, moneySaved: 0 };
    const firstPass = newlyUnlocked(input, unlocked);
    unlocked = [...unlocked, ...firstPass];
    const secondPass = newlyUnlocked(input, unlocked);
    expect(secondPass).toEqual([]);
  });
});
