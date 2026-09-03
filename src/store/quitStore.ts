/**
 * Quit store — local-first source of truth for the user's quit journey.
 * Persisted to AsyncStorage. This holds health-adjacent data (quit/relapse/craving)
 * which must NEVER be sent to analytics/Sentry (enforced at the provider edge).
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  CheckIn,
  CravingEvent,
  CravingTrigger,
  MoodValue,
  QuitPlan,
  Relapse,
} from '@/domain/types';
import { localDateKey } from '@/domain/time';
import { asyncStorage, makeMigrate } from './persist';

/** Persisted data shape defaults — used by the migration guard. */
const PERSISTED_DEFAULTS = {
  plan: null as QuitPlan | null,
  relapses: [] as Relapse[],
  cravings: [] as CravingEvent[],
  checkIns: [] as CheckIn[],
  achievementsUnlocked: [] as string[],
  puffLog: {} as Record<string, number>,
};

export interface QuitState {
  /** Null until onboarding completes and a plan is committed. */
  plan: QuitPlan | null;
  relapses: Relapse[];
  cravings: CravingEvent[];
  checkIns: CheckIn[];
  achievementsUnlocked: string[];
  /** Puff log for taper mode, keyed by local date -> count. */
  puffLog: Record<string, number>;

  // --- lifecycle ---
  startPlan(plan: QuitPlan): void;
  resetAll(): void;

  // --- relapse (streak resets, lifetime keeps counting) ---
  logRelapse(trigger: CravingTrigger, at?: Date): void;

  // --- cravings (supports 1-5 and 1-10 intensity) ---
  logCraving(input: { intensity: number; trigger: CravingTrigger; resisted: boolean }, at?: Date): void;

  // --- check-ins (one per local day; latest wins) ---
  submitCheckIn(mood: MoodValue, at?: Date): void;

  // --- taper puff logging ---
  logPuff(at?: Date): void;
  puffsToday(at?: Date): number;

  // --- achievements ---
  unlockAchievement(id: string): void;

  // --- edits from settings ---
  updateSpend(vapeCostPerWeek: number): void;
  updateQuitDate(iso: string): void;

  // --- import/restore ---
  importData(data: {
    plan: QuitPlan | null;
    relapses: Relapse[];
    cravings: CravingEvent[];
    checkIns: CheckIn[];
    achievementsUnlocked: string[];
    puffLog: Record<string, number>;
  }): void;
}

export const useQuitStore = create<QuitState>()(
  persist(
    (set, get) => ({
      plan: null,
      relapses: [],
      cravings: [],
      checkIns: [],
      achievementsUnlocked: [],
      puffLog: {},

      startPlan(plan) {
        set({
          plan,
          relapses: [],
          cravings: [],
          checkIns: [],
          achievementsUnlocked: [],
          puffLog: {},
        });
      },

      resetAll() {
        set({
          plan: null,
          relapses: [],
          cravings: [],
          checkIns: [],
          achievementsUnlocked: [],
          puffLog: {},
        });
      },

      logRelapse(trigger, at = new Date()) {
        const { plan, relapses } = get();
        if (!plan) return;
        const validAt = at instanceof Date && !Number.isNaN(at.getTime()) ? at : new Date();
        const ts = validAt.toISOString();
        set({
          relapses: [...relapses, { ts, trigger }],
          // Streak resets: the new streak starts at the relapse instant.
          plan: { ...plan, streakStart: ts },
        });
      },

      logCraving(input, at = new Date()) {
        const rawIntensity = Number.isFinite(input.intensity) ? input.intensity : 3;
        const intensity = Math.min(10, Math.max(1, Math.round(rawIntensity)));
        const validAt = at instanceof Date && !Number.isNaN(at.getTime()) ? at : new Date();
        set((s) => ({
          cravings: [
            ...s.cravings,
            { ts: validAt.toISOString(), intensity, trigger: input.trigger, resisted: input.resisted },
          ],
        }));
      },

      submitCheckIn(mood, at = new Date()) {
        const validAt = at instanceof Date && !Number.isNaN(at.getTime()) ? at : new Date();
        const date = localDateKey(validAt);
        const clampedMood = Math.min(5, Math.max(1, Math.round(mood))) as MoodValue;
        set((s) => ({
          checkIns: [...s.checkIns.filter((c) => c.date !== date), { date, mood: clampedMood }],
        }));
      },

      logPuff(at = new Date()) {
        const validAt = at instanceof Date && !Number.isNaN(at.getTime()) ? at : new Date();
        const key = localDateKey(validAt);
        set((s) => ({ puffLog: { ...s.puffLog, [key]: (s.puffLog[key] ?? 0) + 1 } }));
      },

      puffsToday(at = new Date()) {
        const validAt = at instanceof Date && !Number.isNaN(at.getTime()) ? at : new Date();
        return get().puffLog[localDateKey(validAt)] ?? 0;
      },

      unlockAchievement(id) {
        if (!id || typeof id !== 'string') return;
        set((s) =>
          s.achievementsUnlocked.includes(id)
            ? s
            : { achievementsUnlocked: [...s.achievementsUnlocked, id] },
        );
      },

      updateSpend(vapeCostPerWeek) {
        if (!Number.isFinite(vapeCostPerWeek)) return;
        const v = Math.max(0, vapeCostPerWeek);
        set((s) => (s.plan ? { plan: { ...s.plan, vapeCostPerWeek: v } } : s));
      },

      updateQuitDate(iso) {
        if (typeof iso !== 'string' || Number.isNaN(new Date(iso).getTime())) return;
        set((s) => (s.plan ? { plan: { ...s.plan, streakStart: iso } } : s));
      },

      importData(data) {
        set({
          plan: data.plan,
          relapses: data.relapses ?? [],
          cravings: data.cravings ?? [],
          checkIns: data.checkIns ?? [],
          achievementsUnlocked: data.achievementsUnlocked ?? [],
          puffLog: data.puffLog ?? {},
        });
      },
    }),
    {
      name: 'quitvape:quit',
      storage: asyncStorage,
      version: 1,
      // Never drop persisted quit data on a version bump — carry fields forward.
      migrate: makeMigrate(PERSISTED_DEFAULTS),
    },
  ),
);
