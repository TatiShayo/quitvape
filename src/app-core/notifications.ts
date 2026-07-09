/**
 * Notifications engine (BUILD_PROMPT feature 6): schedules local notifications for
 * morning motivation, evening check-in, streak milestones, danger-hour support, and the
 * weekly report. All local (no push infra needed) via expo-notifications.
 *
 * Re-scheduling is idempotent: every category cancels its own prior schedule first by a
 * stable identifier prefix, so calling `scheduleAll` again (e.g. after a settings change
 * or a new danger-hour detection) never duplicates notifications.
 */
import * as Notifications from 'expo-notifications';
import { CravingEvent } from '@/domain/types';
import { detectDangerHour, dangerHourPingTime } from '@/domain/dangerHour';
import { STREAK_MILESTONES } from '@/domain/streak';
import {
  DANGER_HOUR_BODY,
  DANGER_HOUR_TITLE,
  EVENING_CHECKIN_BODY,
  EVENING_CHECKIN_TITLE,
  WEEKLY_REPORT_BODY,
  WEEKLY_REPORT_TITLE,
  milestoneNotification,
  pickMorningCopy,
} from '@/content/notifications';
import { NotificationPrefs } from '@/store';

/** Stable id prefixes so we can cancel-then-reschedule each category independently. */
const IDS = {
  morning: 'qv-morning',
  evening: 'qv-evening',
  dangerHour: 'qv-danger-hour',
  weeklyReport: 'qv-weekly-report',
  milestone: (days: number) => `qv-milestone-${days}`,
} as const;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

async function cancelById(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

/** Morning motivation, daily at the user's chosen local time. */
export async function scheduleMorningMotivation(morningTime: string): Promise<void> {
  await cancelById(IDS.morning);
  const [hourStr, minuteStr] = morningTime.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return;
  await Notifications.scheduleNotificationAsync({
    identifier: IDS.morning,
    content: { title: pickMorningCopy(new Date()), body: '' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
}

/** Evening mood check-in prompt, daily at 8pm local. */
export async function scheduleEveningCheckIn(): Promise<void> {
  await cancelById(IDS.evening);
  await Notifications.scheduleNotificationAsync({
    identifier: IDS.evening,
    content: { title: EVENING_CHECKIN_TITLE, body: EVENING_CHECKIN_BODY },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 20, minute: 0 },
  });
}

/** Sunday weekly-report nudge, 6pm local. */
export async function scheduleWeeklyReport(): Promise<void> {
  await cancelById(IDS.weeklyReport);
  await Notifications.scheduleNotificationAsync({
    identifier: IDS.weeklyReport,
    content: { title: WEEKLY_REPORT_TITLE, body: WEEKLY_REPORT_BODY },
    // Weekday 1 = Sunday per expo-notifications convention.
    trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 1, hour: 18, minute: 0 },
  });
}

/**
 * Danger-hour support ping, derived from the user's own craving log (BUILD_PROMPT:
 * "most cravings logged 9-11pm -> schedule support ping 8:45pm"). No-ops (and clears
 * any prior schedule) until there's enough data to detect a pattern.
 */
export async function scheduleDangerHour(cravings: CravingEvent[]): Promise<void> {
  await cancelById(IDS.dangerHour);
  const hour = detectDangerHour(cravings);
  if (hour === undefined) return;
  const { hour: pingHour, minute: pingMinute } = dangerHourPingTime(hour);
  await Notifications.scheduleNotificationAsync({
    identifier: IDS.dangerHour,
    content: { title: DANGER_HOUR_TITLE, body: DANGER_HOUR_BODY },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: pingHour, minute: pingMinute },
  });
}

/**
 * Schedules a one-shot celebration for the next unreached milestone from `streakDays`.
 * Fired as a DATE trigger relative to `streakStart`, so it's exact even though the app
 * may not be foregrounded when the milestone is crossed.
 */
export async function scheduleNextMilestone(streakStart: Date, streakDays: number): Promise<void> {
  const next = STREAK_MILESTONES.find((m) => m > streakDays);
  if (!next) return;
  const id = IDS.milestone(next);
  await cancelById(id);
  const fireAt = new Date(streakStart.getTime() + next * 24 * 60 * 60 * 1000);
  if (fireAt.getTime() <= Date.now()) return;
  const { title, body } = milestoneNotification(next);
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt },
  });
}

/**
 * Buddy milestone/relapse notifications (BUILD_PROMPT feature 12). There is no real
 * push-delivery transport in this build (expo-notifications here is LOCAL-only, and no
 * push-token/server-push infra exists — NEEDS HUMAN if cross-device delivery is wanted).
 * These fire immediately (trigger: null) on THIS device when `useBuddy` detects, on a
 * foreground refresh, that the paired buddy's synced streak crossed a milestone or
 * dropped back near zero (a relapse) since the last time it was checked — a pragmatic
 * poll-on-foreground stand-in for a real push notification from the other device.
 */
export async function notifyBuddyMilestone(days: number): Promise<void> {
  if (!(await requestNotificationPermission())) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Your buddy hit a milestone',
      body: `They just reached ${days} days vape-free. Send them a boost.`,
    },
    trigger: null,
  });
}

export async function notifyBuddyRelapse(): Promise<void> {
  if (!(await requestNotificationPermission())) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Your buddy had a hard moment',
      body: 'They logged a slip and started again. A little encouragement goes a long way.',
    },
    trigger: null,
  });
}

/** Cancels every category. Used on relapse-reset (milestones re-derive from new start) and data deletion. */
export async function cancelAllQuitVapeNotifications(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith('qv-'))
      .map((n) => cancelById(n.identifier)),
  );
}

interface ScheduleAllInput {
  prefs: NotificationPrefs;
  streakStart: Date;
  streakDays: number;
  cravings: CravingEvent[];
}

/** Re-derives and reschedules every enabled category. Call after onboarding, relapse, and craving logs. */
export async function scheduleAllNotifications(input: ScheduleAllInput): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const { prefs } = input;
  if (prefs.morningMotivation) await scheduleMorningMotivation(prefs.morningTime);
  else await cancelById(IDS.morning);

  if (prefs.eveningCheckIn) await scheduleEveningCheckIn();
  else await cancelById(IDS.evening);

  if (prefs.weeklyReport) await scheduleWeeklyReport();
  else await cancelById(IDS.weeklyReport);

  if (prefs.dangerHour) await scheduleDangerHour(input.cravings);
  else await cancelById(IDS.dangerHour);

  if (prefs.milestones) await scheduleNextMilestone(input.streakStart, input.streakDays);
}
