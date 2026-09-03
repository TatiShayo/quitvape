import { ACHIEVEMENTS, evaluateUnlockedAchievements, newlyUnlocked } from '../achievements';

describe('ACHIEVEMENTS definition list', () => {
  it('has unique IDs and valid definitions', () => {
    const ids = new Set<string>();
    for (const a of ACHIEVEMENTS) {
      expect(ids.has(a.id)).toBe(false);
      ids.add(a.id);
      expect(a.title.length).toBeGreaterThan(0);
      expect(a.cardLabel.length).toBeGreaterThan(0);
      expect(a.description.length).toBeGreaterThan(0);
      expect(['streak', 'cravings', 'money']).toContain(a.category);
    }
  });
});

describe('evaluateUnlockedAchievements', () => {
  it('unlocks nothing at zero state', () => {
    expect(
      evaluateUnlockedAchievements({ streakDays: 0, cravingsResistedCount: 0, moneySaved: 0 }),
    ).toEqual([]);
  });

  it('handles negative or NaN inputs safely by treating as zero', () => {
    expect(
      evaluateUnlockedAchievements({ streakDays: -5, cravingsResistedCount: -10, moneySaved: -100 }),
    ).toEqual([]);
    expect(
      evaluateUnlockedAchievements({ streakDays: NaN, cravingsResistedCount: NaN, moneySaved: NaN }),
    ).toEqual([]);
  });

  it('unlocks streak milestones cumulatively', () => {
    expect(
      evaluateUnlockedAchievements({ streakDays: 14, cravingsResistedCount: 0, moneySaved: 0 }),
    ).toEqual(['day_1', 'hour_72', 'week_1', 'week_2']);
  });

  it('unlocks high-tier streak milestones (month 3, month 6, year 1)', () => {
    const result = evaluateUnlockedAchievements({
      streakDays: 400,
      cravingsResistedCount: 0,
      moneySaved: 0,
    });
    expect(result).toContain('month_1');
    expect(result).toContain('month_3');
    expect(result).toContain('month_6');
    expect(result).toContain('year_1');
  });

  it('unlocks craving-resisted and money milestones across all tiers', () => {
    const result = evaluateUnlockedAchievements({
      streakDays: 0,
      cravingsResistedCount: 150,
      moneySaved: 1200,
    });
    expect(result).toContain('cravings_25_resisted');
    expect(result).toContain('cravings_50_resisted');
    expect(result).toContain('puffs_100_resisted');
    expect(result).toContain('saved_100');
    expect(result).toContain('saved_500');
    expect(result).toContain('saved_1000');
    expect(result).not.toContain('day_1');
  });

  it('does not unlock below thresholds (boundary check)', () => {
    const result = evaluateUnlockedAchievements({
      streakDays: 6,
      cravingsResistedCount: 24,
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
    const input = { streakDays: 30, cravingsResistedCount: 50, moneySaved: 500 };
    const firstPass = newlyUnlocked(input, unlocked);
    unlocked = [...unlocked, ...firstPass];
    const secondPass = newlyUnlocked(input, unlocked);
    expect(secondPass).toEqual([]);
  });
});
