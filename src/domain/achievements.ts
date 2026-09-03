/**
 * Achievement definitions + unlock evaluation. Pure functions over streak/craving/money state.
 * Fully unit-tested and idempotent.
 */

export type AchievementId =
  | 'day_1'
  | 'hour_72'
  | 'week_1'
  | 'week_2'
  | 'month_1'
  | 'month_3'
  | 'month_6'
  | 'year_1'
  | 'cravings_25_resisted'
  | 'cravings_50_resisted'
  | 'puffs_100_resisted'
  | 'saved_100'
  | 'saved_500'
  | 'saved_1000';

export interface AchievementDef {
  id: AchievementId;
  title: string;
  /** Short share-card stat label, e.g. "24 HOURS". */
  cardLabel: string;
  description: string;
  category: 'streak' | 'cravings' | 'money';
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'day_1',
    title: '24 Hours',
    cardLabel: '24 HOURS',
    description: 'You made it through the hardest day.',
    category: 'streak',
  },
  {
    id: 'hour_72',
    title: '72 Hours',
    cardLabel: '72 HOURS',
    description: 'Nicotine is fully out of your system.',
    category: 'streak',
  },
  {
    id: 'week_1',
    title: '1 Week',
    cardLabel: '1 WEEK',
    description: 'Seven days vape-free. A real habit is forming.',
    category: 'streak',
  },
  {
    id: 'week_2',
    title: '2 Weeks',
    cardLabel: '2 WEEKS',
    description: 'Circulation and lung function are improving.',
    category: 'streak',
  },
  {
    id: 'month_1',
    title: '1 Month',
    cardLabel: '1 MONTH',
    description: 'A full month. This is who you are now.',
    category: 'streak',
  },
  {
    id: 'month_3',
    title: '3 Months',
    cardLabel: '3 MONTHS',
    description: 'Brain receptor density has reset toward baseline.',
    category: 'streak',
  },
  {
    id: 'month_6',
    title: '6 Months',
    cardLabel: '6 MONTHS',
    description: 'Half a year of clean breathing and reclaimed freedom.',
    category: 'streak',
  },
  {
    id: 'year_1',
    title: '1 Year',
    cardLabel: '1 YEAR',
    description: '365 days clean. Coronary risk is halved.',
    category: 'streak',
  },
  {
    id: 'cravings_25_resisted',
    title: '25 Cravings Resisted',
    cardLabel: '25 RESISTED',
    description: 'Twenty-five urges met and conquered.',
    category: 'cravings',
  },
  {
    id: 'cravings_50_resisted',
    title: '50 Cravings Resisted',
    cardLabel: '50 RESISTED',
    description: 'Fifty moments of self-mastery.',
    category: 'cravings',
  },
  {
    id: 'puffs_100_resisted',
    title: '100 Cravings Resisted',
    cardLabel: '100 RESISTED',
    description: 'A hundred moments you chose yourself over the craving.',
    category: 'cravings',
  },
  {
    id: 'saved_100',
    title: '$100 Saved',
    cardLabel: '$100 SAVED',
    description: 'A hundred dollars that used to go up in smoke.',
    category: 'money',
  },
  {
    id: 'saved_500',
    title: '$500 Saved',
    cardLabel: '$500 SAVED',
    description: 'Half a grand kept in your bank account.',
    category: 'money',
  },
  {
    id: 'saved_1000',
    title: '$1,000 Saved',
    cardLabel: '$1,000 SAVED',
    description: 'One thousand dollars saved since your quit date.',
    category: 'money',
  },
];

export interface AchievementEvalInput {
  streakDays: number;
  cravingsResistedCount: number;
  moneySaved: number;
}

/** Returns the ids that SHOULD be unlocked given current state (idempotent, order-free). */
export function evaluateUnlockedAchievements(input: AchievementEvalInput): AchievementId[] {
  const unlocked: AchievementId[] = [];
  const streak = Math.max(0, input.streakDays || 0);
  const resisted = Math.max(0, input.cravingsResistedCount || 0);
  const money = Math.max(0, input.moneySaved || 0);

  if (streak >= 1) unlocked.push('day_1');
  if (streak >= 3) unlocked.push('hour_72');
  if (streak >= 7) unlocked.push('week_1');
  if (streak >= 14) unlocked.push('week_2');
  if (streak >= 30) unlocked.push('month_1');
  if (streak >= 90) unlocked.push('month_3');
  if (streak >= 180) unlocked.push('month_6');
  if (streak >= 365) unlocked.push('year_1');

  if (resisted >= 25) unlocked.push('cravings_25_resisted');
  if (resisted >= 50) unlocked.push('cravings_50_resisted');
  if (resisted >= 100) unlocked.push('puffs_100_resisted');

  if (money >= 100) unlocked.push('saved_100');
  if (money >= 500) unlocked.push('saved_500');
  if (money >= 1000) unlocked.push('saved_1000');

  return unlocked;
}

/** Newly-crossed achievements this evaluation that weren't already recorded. */
export function newlyUnlocked(
  input: AchievementEvalInput,
  alreadyUnlocked: string[],
): AchievementId[] {
  const now = evaluateUnlockedAchievements(input);
  return now.filter((id) => !alreadyUnlocked.includes(id));
}
