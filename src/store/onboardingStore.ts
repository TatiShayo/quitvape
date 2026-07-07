/**
 * Onboarding store — holds in-progress quiz answers before a plan is committed.
 * Persisted so a user who drops mid-quiz can resume. Cleared once startPlan runs.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { QuitMethod, QuitReason } from '@/domain/types';
import { asyncStorage } from './persist';

export interface QuizAnswers {
  ageRange?: '18-24' | '25-34' | '35-44' | '45+';
  yearsVaping?: number;
  deviceType?: 'disposable' | 'pod' | 'mod' | 'other';
  puffsPerDay?: number;
  firstPuffOnWaking?: boolean;
  failedQuitAttempts?: number;
  reasons?: QuitReason[];
  vapeCostPerWeek?: number;
  nicotineStrengthMgMl?: number;
  method?: QuitMethod;
}

export interface OnboardingState {
  answers: QuizAnswers;
  /** Highest quiz screen index reached (for resume + drop-off analytics). */
  furthestScreen: number;
  /** True once the age gate (18+) has been confirmed. */
  ageConfirmed: boolean;

  setAnswer<K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]): void;
  markScreen(index: number): void;
  confirmAge(): void;
  clear(): void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      answers: {},
      furthestScreen: 0,
      ageConfirmed: false,

      setAnswer(key, value) {
        set((s) => ({ answers: { ...s.answers, [key]: value } }));
      },
      markScreen(index) {
        set((s) => ({ furthestScreen: Math.max(s.furthestScreen, index) }));
      },
      confirmAge() {
        set({ ageConfirmed: true });
      },
      clear() {
        set({ answers: {}, furthestScreen: 0 });
      },
    }),
    { name: 'quitvape:onboarding', storage: asyncStorage, version: 1 },
  ),
);
