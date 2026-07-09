/**
 * Accountability buddy hook (BUILD_PROMPT feature 12): invite deep-link generation,
 * paired-streak sync, and a poll-on-foreground stand-in for buddy milestone/relapse
 * notifications (this build has no push-delivery transport across devices — see the
 * comment on `notifyBuddyMilestone`/`notifyBuddyRelapse` in `src/app-core/notifications.ts`).
 */
import { useCallback, useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { getBackend, getErrors } from '@/providers';
import { BuddyInfo } from '@/providers/types';
import { EncouragementPresetId } from '@/content/encouragements';
import { useQuitStore, useSettingsStore } from '@/store';
import { useNow } from './useNow';
import { notifyBuddyMilestone, notifyBuddyRelapse } from './notifications';
import { currentStreakDays, STREAK_MILESTONES } from '@/domain/streak';

export function buddyInviteUrl(token: string): string {
  return Linking.createURL('/buddy', { queryParams: { token } });
}

export function useBuddy() {
  const plan = useQuitStore((s) => s.plan);
  const now = useNow(60_000);
  const streakDays = plan ? currentStreakDays(new Date(plan.streakStart), now) : 0;
  const lastSeenBuddyStreakDays = useSettingsStore((s) => s.lastSeenBuddyStreakDays);
  const setLastSeenBuddyStreakDays = useSettingsStore((s) => s.setLastSeenBuddyStreakDays);

  const [buddy, setBuddy] = useState<BuddyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await getBackend().ensureAnonSession();
      const info = await getBackend().getBuddy();
      setBuddy(info);

      if (info?.paired && info.buddyStreakDays !== undefined) {
        const prev = lastSeenBuddyStreakDays;
        const current = info.buddyStreakDays;
        if (prev !== undefined) {
          const crossed = STREAK_MILESTONES.find((m) => prev < m && current >= m);
          if (crossed) void notifyBuddyMilestone(crossed);
          else if (current < prev && current <= 1) void notifyBuddyRelapse();
        }
        setLastSeenBuddyStreakDays(current);
      }
    } catch (e) {
      getErrors().captureException(e, { where: 'useBuddy.refresh' });
      setBuddy(null);
    } finally {
      setLoading(false);
    }
  }, [lastSeenBuddyStreakDays, setLastSeenBuddyStreakDays]);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh only on mount; re-invoked explicitly after invite/accept actions
  }, []);

  // Keep the paired buddy's view of our own streak fresh (the one deliberate exception
  // to "health data stays local" — see buddy_streaks RLS in the migration).
  useEffect(() => {
    if (!plan || !buddy?.paired) return;
    void getBackend().syncMyStreak(streakDays);
  }, [plan, buddy?.paired, streakDays]);

  const createInvite = useCallback(async () => {
    const info = await getBackend().createBuddyInvite();
    setBuddy(info);
    return info;
  }, []);

  const acceptInvite = useCallback(async (token: string) => {
    const info = await getBackend().acceptBuddyInvite(token.trim());
    setBuddy(info);
    return info;
  }, []);

  const sendEncouragement = useCallback(
    async (presetId: EncouragementPresetId) => {
      if (!buddy) return;
      await getBackend().sendBuddyEncouragement(buddy.id, presetId);
    },
    [buddy],
  );

  return {
    buddy,
    loading,
    refresh,
    createInvite,
    acceptInvite,
    sendEncouragement,
    inviteUrl: buddy?.inviteToken ? buddyInviteUrl(buddy.inviteToken) : undefined,
  };
}
