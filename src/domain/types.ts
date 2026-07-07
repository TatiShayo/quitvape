/** Core domain types for the local-first quit model. */

export type QuitMethod = 'cold_turkey' | 'taper';

export type CravingTrigger = 'stress' | 'social' | 'boredom' | 'drinking' | 'other';

export type QuitReason = 'money' | 'health' | 'freedom' | 'relationship';

export type MoodValue = 1 | 2 | 3 | 4 | 5;

export interface Relapse {
  /** ISO timestamp of the relapse. */
  ts: string;
  trigger: CravingTrigger;
}

export interface CravingEvent {
  ts: string;
  /** 1-5 intensity. */
  intensity: number;
  trigger: CravingTrigger;
  resisted: boolean;
}

export interface CheckIn {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  mood: MoodValue;
}

export interface QuitPlan {
  method: QuitMethod;
  /** ISO timestamp the current streak/plan started from. */
  streakStart: string;
  /** ISO of the original quit date (first attempt), for lifetime stats. */
  originalQuitDate: string;
  /** Baseline puffs/day at start (for taper schedule + money math). */
  baselinePuffsPerDay: number;
  /** Weekly spend in the user's currency at baseline. */
  vapeCostPerWeek: number;
  /** 0-10 dependency score from the quiz. */
  dependencyScore: number;
  reasons: QuitReason[];
  /** Taper only: weekly reduction fraction (default 0.15 = -15%/week). */
  taperWeeklyReduction?: number;
}
