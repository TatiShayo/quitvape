/**
 * Pure notification schedule planner and payload generator.
 * Completely decoupled from native SDKs so it can be verified under rigorous unit tests
 * across edge cases (leap years, timezone shifts, empty logs, malformed inputs).
 */
import { CravingEvent } from './types';
import { detectDangerHour, dangerHourPingTime } from './dangerHour';
import { STREAK_MILESTONES } from './streak';
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
import { NotificationPrefs } from '@/store/settingsStore';

export type TriggerType = 'daily' | 'weekly' | 'date';

export interface NotificationPayload {
  title: string;
  body: string;
}

export interface ScheduledPlanItem {
  identifier: string;
  category: 'morning' | 'evening' | 'dangerHour' | 'weeklyReport' | 'milestone';
  payload: NotificationPayload;
  triggerType: TriggerType;
  /** For daily triggers: hour (0-23) and minute (0-59) */
  dailyTrigger?: { hour: number; minute: number };
  /** For weekly triggers: weekday (1=Sunday), hour, minute */
  weeklyTrigger?: { weekday: number; hour: number; minute: number };
  /** For one-shot date triggers: exact ISO date string */
  dateTrigger?: string;
}

/** Parses a HH:mm string safely with validation and fallback. */
export function parseTimeHHMM(
  timeStr: string | undefined,
  fallbackHour = 8,
  fallbackMinute = 0,
): { hour: number; minute: number } {
  if (!timeStr || typeof timeStr !== 'string') {
    return { hour: fallbackHour, minute: fallbackMinute };
  }
  const parts = timeStr.trim().split(':');
  if (parts.length !== 2) {
    return { hour: fallbackHour, minute: fallbackMinute };
  }
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isInteger(h) || h < 0 || h > 23 || !Number.isInteger(m) || m < 0 || m > 59) {
    return { hour: fallbackHour, minute: fallbackMinute };
  }
  return { hour: h, minute: m };
}

export interface SchedulePlanInput {
  prefs: NotificationPrefs;
  streakStart: Date;
  streakDays: number;
  cravings: CravingEvent[];
  now?: Date;
}

/** Generates the complete list of notification payloads and schedules that should be active. */
export function generateCompleteNotificationPlan(input: SchedulePlanInput): ScheduledPlanItem[] {
  const plan: ScheduledPlanItem[] = [];
  const now = input.now ?? new Date();
  const { prefs } = input;

  if (prefs.morningMotivation) {
    const { hour, minute } = parseTimeHHMM(prefs.morningTime, 8, 0);
    plan.push({
      identifier: 'qv-morning',
      category: 'morning',
      payload: {
        title: pickMorningCopy(now),
        body: '',
      },
      triggerType: 'daily',
      dailyTrigger: { hour, minute },
    });
  }

  if (prefs.eveningCheckIn) {
    plan.push({
      identifier: 'qv-evening',
      category: 'evening',
      payload: {
        title: EVENING_CHECKIN_TITLE,
        body: EVENING_CHECKIN_BODY,
      },
      triggerType: 'daily',
      dailyTrigger: { hour: 20, minute: 0 },
    });
  }

  if (prefs.weeklyReport) {
    plan.push({
      identifier: 'qv-weekly-report',
      category: 'weeklyReport',
      payload: {
        title: WEEKLY_REPORT_TITLE,
        body: WEEKLY_REPORT_BODY,
      },
      triggerType: 'weekly',
      weeklyTrigger: { weekday: 1, hour: 18, minute: 0 },
    });
  }

  if (prefs.dangerHour) {
    const dangerHour = detectDangerHour(input.cravings);
    if (dangerHour !== undefined) {
      const { hour, minute } = dangerHourPingTime(dangerHour);
      plan.push({
        identifier: 'qv-danger-hour',
        category: 'dangerHour',
        payload: {
          title: DANGER_HOUR_TITLE,
          body: DANGER_HOUR_BODY,
        },
        triggerType: 'daily',
        dailyTrigger: { hour, minute },
      });
    }
  }

  if (prefs.milestones && !Number.isNaN(input.streakStart.getTime())) {
    const nextMilestone = STREAK_MILESTONES.find((m) => m > input.streakDays);
    if (nextMilestone) {
      const fireAt = new Date(input.streakStart.getTime() + nextMilestone * 24 * 60 * 60 * 1000);
      if (fireAt.getTime() > now.getTime()) {
        const { title, body } = milestoneNotification(nextMilestone);
        plan.push({
          identifier: `qv-milestone-${nextMilestone}`,
          category: 'milestone',
          payload: { title, body },
          triggerType: 'date',
          dateTrigger: fireAt.toISOString(),
        });
      }
    }
  }

  return plan;
}
