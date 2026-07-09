/**
 * Settings store — notification prefs + cached entitlement snapshot. The entitlement is
 * re-checked live from the purchases provider on foreground; this cached copy is only a
 * fast-path for gating UI before the async check resolves.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { asyncStorage } from './persist';

export interface NotificationPrefs {
  morningMotivation: boolean;
  eveningCheckIn: boolean;
  milestones: boolean;
  dangerHour: boolean;
  weeklyReport: boolean;
  buddy: boolean;
  /** Preferred morning push time, local HH:mm. */
  morningTime: string;
}

const DEFAULT_PREFS: NotificationPrefs = {
  morningMotivation: true,
  eveningCheckIn: true,
  milestones: true,
  dangerHour: true,
  weeklyReport: true,
  buddy: true,
  morningTime: '08:00',
};

export interface SettingsState {
  notifications: NotificationPrefs;
  /** Cached premium flag (authoritative check lives in purchases provider). */
  cachedPremium: boolean;
  /** True once the smart review prompt has been shown (fire exactly once). */
  reviewPrompted: boolean;
  /**
   * Last buddy streak day count this device observed (see `src/app-core/useBuddy.ts`).
   * Used only to detect a milestone-crossed/relapse edge on the next foreground refresh
   * — never treated as this device's own health data.
   */
  lastSeenBuddyStreakDays?: number;

  setNotificationPref<K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]): void;
  setCachedPremium(value: boolean): void;
  markReviewPrompted(): void;
  setLastSeenBuddyStreakDays(days: number): void;
  reset(): void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notifications: DEFAULT_PREFS,
      cachedPremium: false,
      reviewPrompted: false,
      lastSeenBuddyStreakDays: undefined,

      setNotificationPref(key, value) {
        set((s) => ({ notifications: { ...s.notifications, [key]: value } }));
      },
      setCachedPremium(value) {
        set({ cachedPremium: value });
      },
      markReviewPrompted() {
        set({ reviewPrompted: true });
      },
      setLastSeenBuddyStreakDays(days) {
        set({ lastSeenBuddyStreakDays: days });
      },
      reset() {
        set({
          notifications: DEFAULT_PREFS,
          cachedPremium: false,
          reviewPrompted: false,
          lastSeenBuddyStreakDays: undefined,
        });
      },
    }),
    { name: 'quitvape:settings', storage: asyncStorage, version: 1 },
  ),
);
