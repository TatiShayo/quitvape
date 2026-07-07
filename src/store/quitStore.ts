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
  QuitMethod,
  QuitPlan,
  QuitReason,
  Relapse,
} from '@/domain/types';
import { localDateKey } from '@/domain/time';
import { asyncStorage } from './persist';

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

  // --- cravings ---
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
        const ts = at.toISOString();
        set({
          relapses: [...relapses, { ts, trigger }],
          // Streak resets: the new streak starts at the relapse instant.
          plan: { ...plan, streakStart: ts },
        });
      },

      logCraving(input, at = new Date()) {
        const intensity = Math.min(5, Math.max(1, Math.round(input.intensity)));
        set((s) => ({
          cravings: [
            ...s.cravings,
            { ts: at.toISOString(), intensity, trigger: input.trigger, resisted: input.resisted },
          ],
        }));
      },

      submitCheckIn(mood, at = new Date()) {
        const date = localDateKey(at);
        set((s) => ({
          checkIns: [...s.checkIns.filter((c) => c.date !== date), { date, mood }],
        }));
      },

      logPuff(at = new Date()) {
        const key = localDateKey(at);
        set((s) => ({ puffLog: { ...s.puffLog, [key]: (s.puffLog[key] ?? 0) + 1 } }));
      },

      puffsToday(at = new Date()) {
        return get().puffLog[localDateKey(at)] ?? 0;
      },

      unlockAchievement(id) {
        set((s) =>
          s.achievementsUnlocked.includes(id)
            ? s
            : { achievementsUnlocked: [...s.achievementsUnlocked, id] },
        );
      },

      updateSpend(vapeCostPerWeek) {
        const v = Math.max(0, vapeCostPerWeek);
        set((s) => (s.plan ? { plan: { ...s.plan, vapeCostPerWeek: v } } : s));
      },

      updateQuitDate(iso) {
        set((s) => (s.plan ? { plan: { ...s.plan, streakStart: iso } } : s));
      },
    }),
    {
      name: 'quitvape:quit',
      storage: asyncStorage,
      version: 1,
    },
  ),
);
