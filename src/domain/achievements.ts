/**
 * Achievement definitions + unlock evaluation (BUILD_PROMPT feature 8). Pure functions
 * over streak/craving/money state so they're trivially unit-testable, same pattern as
 * the other domain modules. Each unlock is the trigger for a share-card export.
 */

export type AchievementId =
  | 'day_1'
  | 'hour_72'
  | 'week_1'
  | 'week_2'
  | 'month_1'
  | 'puffs_100_resisted'
  | 'saved_100';

export interface AchievementDef {
  id: AchievementId;
  title: string;
  /** Short share-card stat label, e.g. "24 HOURS". */
  cardLabel: string;
  description: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'day_1', title: '24 Hours', cardLabel: '24 HOURS', description: 'You made it through the hardest day.' },
  { id: 'hour_72', title: '72 Hours', cardLabel: '72 HOURS', description: 'Nicotine is fully out of your system.' },
  { id: 'week_1', title: '1 Week', cardLabel: '1 WEEK', description: 'Seven days vape-free. A real habit is forming.' },
  { id: 'week_2', title: '2 Weeks', cardLabel: '2 WEEKS', description: 'Circulation and lung function are improving.' },
  { id: 'month_1', title: '1 Month', cardLabel: '1 MONTH', description: 'A full month. This is who you are now.' },
  {
    id: 'puffs_100_resisted',
    title: '100 Cravings Resisted',
    cardLabel: '100 RESISTED',
    description: 'A hundred moments you chose yourself over the craving.',
  },
  { id: 'saved_100', title: '$100 Saved', cardLabel: '$100 SAVED', description: 'A hundred dollars that used to go up in smoke.' },
];

export interface AchievementEvalInput {
  streakDays: number;
  cravingsResistedCount: number;
  moneySaved: number;
}

/** Returns the ids that SHOULD be unlocked given current state (idempotent, order-free). */
export function evaluateUnlockedAchievements(input: AchievementEvalInput): AchievementId[] {
  const unlocked: AchievementId[] = [];
  if (input.streakDays >= 1) unlocked.push('day_1');
  if (input.streakDays >= 3) unlocked.push('hour_72');
  if (input.streakDays >= 7) unlocked.push('week_1');
  if (input.streakDays >= 14) unlocked.push('week_2');
  if (input.streakDays >= 30) unlocked.push('month_1');
  if (input.cravingsResistedCount >= 100) unlocked.push('puffs_100_resisted');
  if (input.moneySaved >= 100) unlocked.push('saved_100');
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
