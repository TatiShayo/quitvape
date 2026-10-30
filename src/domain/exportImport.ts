/**
 * Data export / import and offline storage validation.
 * Enables users to safely back up their entire quit journey or restore on a new device.
 * Enforces strict validation, range clamping, timestamp verification, and schema sanitization.
 */
import { CheckIn, CravingEvent, CravingTrigger, MoodValue, QuitMethod, QuitPlan, QuitReason, Relapse } from './types';
import { NotificationPrefs } from '@/store/settingsStore';

export const EXPORT_SCHEMA_VERSION = 1;
export const APP_IDENTIFIER = 'QuitVape';

export interface ExportData {
  plan: QuitPlan | null;
  relapses: Relapse[];
  cravings: CravingEvent[];
  checkIns: CheckIn[];
  achievementsUnlocked: string[];
  puffLog: Record<string, number>;
  notificationPrefs?: NotificationPrefs;
}

export interface ExportPayload {
  app: typeof APP_IDENTIFIER;
  version: number;
  exportedAt: string;
  data: ExportData;
}

export type ImportValidationResult =
  | { success: true; data: ExportData; warnings: string[] }
  | { success: false; error: string };

const VALID_METHODS: QuitMethod[] = ['cold_turkey', 'taper'];
const VALID_TRIGGERS: CravingTrigger[] = ['stress', 'social', 'boredom', 'drinking', 'other'];
const VALID_REASONS: QuitReason[] = ['health', 'money', 'freedom', 'relationship'];

function isValidIsoDate(str: unknown): str is string {
  if (typeof str !== 'string') return false;
  const d = new Date(str);
  return !Number.isNaN(d.getTime());
}

function isValidCalendarDate(str: unknown): str is string {
  if (typeof str !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !Number.isNaN(new Date(str).getTime());
}

/** Generates a formatted, serialized JSON export payload. */
export function createExportPayload(data: ExportData, now = new Date()): string {
  const payload: ExportPayload = {
    app: APP_IDENTIFIER,
    version: EXPORT_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    data: {
      plan: data.plan ? { ...data.plan } : null,
      relapses: [...data.relapses],
      cravings: [...data.cravings],
      checkIns: [...data.checkIns],
      achievementsUnlocked: [...data.achievementsUnlocked],
      puffLog: { ...data.puffLog },
      notificationPrefs: data.notificationPrefs ? { ...data.notificationPrefs } : undefined,
    },
  };
  return JSON.stringify(payload, null, 2);
}

/** Validates and sanitizes a raw JSON string for safe state restoration. */
export function validateAndSanitizeImport(rawJson: string): ImportValidationResult {
  if (typeof rawJson !== 'string' || rawJson.trim().length === 0) {
    return { success: false, error: 'Empty or invalid import file.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { success: false, error: 'JSON parse error: file is corrupted or not valid JSON.' };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { success: false, error: 'Invalid backup format: root must be an object.' };
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.app !== APP_IDENTIFIER) {
    return { success: false, error: `Unrecognized backup format. Expected app "${APP_IDENTIFIER}".` };
  }

  if (typeof obj.version !== 'number' || obj.version > EXPORT_SCHEMA_VERSION) {
    return {
      success: false,
      error: `Unsupported backup schema version (${String(obj.version)}). Please update the app.`,
    };
  }

  if (typeof obj.data !== 'object' || obj.data === null) {
    return { success: false, error: 'Missing or corrupted "data" section in backup.' };
  }

  const rawData = obj.data as Record<string, unknown>;
  const warnings: string[] = [];

  let plan: QuitPlan | null = null;
  if (rawData.plan !== null && typeof rawData.plan === 'object') {
    const p = rawData.plan as Record<string, unknown>;
    const method = VALID_METHODS.includes(p.method as QuitMethod)
      ? (p.method as QuitMethod)
      : 'cold_turkey';
    const streakStart = isValidIsoDate(p.streakStart) ? (p.streakStart as string) : new Date().toISOString();
    const originalQuitDate = isValidIsoDate(p.originalQuitDate)
      ? (p.originalQuitDate as string)
      : streakStart;
    const baselinePuffsPerDay =
      typeof p.baselinePuffsPerDay === 'number' && p.baselinePuffsPerDay > 0
        ? Math.round(p.baselinePuffsPerDay)
        : 150;
    const vapeCostPerWeek =
      typeof p.vapeCostPerWeek === 'number' && Number.isFinite(p.vapeCostPerWeek)
        ? Math.max(0, p.vapeCostPerWeek)
        : 25;
    const dependencyScore =
      typeof p.dependencyScore === 'number' && Number.isFinite(p.dependencyScore)
        ? Math.min(10, Math.max(0, p.dependencyScore))
        : 5;

    const reasons: QuitReason[] = Array.isArray(p.reasons)
      ? (p.reasons.filter((r) => VALID_REASONS.includes(r as QuitReason)) as QuitReason[])
      : ['health'];

    const taperWeeklyReduction =
      typeof p.taperWeeklyReduction === 'number' && Number.isFinite(p.taperWeeklyReduction)
        ? Math.min(0.9, Math.max(0.01, p.taperWeeklyReduction))
        : undefined;

    plan = {
      method,
      streakStart,
      originalQuitDate,
      baselinePuffsPerDay,
      vapeCostPerWeek,
      dependencyScore,
      reasons: reasons.length > 0 ? reasons : ['health'],
      taperWeeklyReduction: method === 'taper' ? (taperWeeklyReduction ?? 0.15) : undefined,
    };
  }

  const relapses: Relapse[] = [];
  if (Array.isArray(rawData.relapses)) {
    for (const r of rawData.relapses) {
      if (typeof r === 'object' && r !== null) {
        const item = r as Record<string, unknown>;
        if (isValidIsoDate(item.ts)) {
          const trigger = VALID_TRIGGERS.includes(item.trigger as CravingTrigger)
            ? (item.trigger as CravingTrigger)
            : 'other';
          relapses.push({ ts: item.ts as string, trigger });
        }
      }
    }
  }

  const cravings: CravingEvent[] = [];
  if (Array.isArray(rawData.cravings)) {
    for (const c of rawData.cravings) {
      if (typeof c === 'object' && c !== null) {
        const item = c as Record<string, unknown>;
        if (isValidIsoDate(item.ts)) {
          const intensity =
            typeof item.intensity === 'number' && Number.isFinite(item.intensity)
              ? Math.min(10, Math.max(1, Math.round(item.intensity)))
              : 3;
          const trigger = VALID_TRIGGERS.includes(item.trigger as CravingTrigger)
            ? (item.trigger as CravingTrigger)
            : 'other';
          const resisted = typeof item.resisted === 'boolean' ? item.resisted : true;
          cravings.push({ ts: item.ts as string, intensity, trigger, resisted });
        }
      }
    }
  }

  const checkIns: CheckIn[] = [];
  if (Array.isArray(rawData.checkIns)) {
    for (const ci of rawData.checkIns) {
      if (typeof ci === 'object' && ci !== null) {
        const item = ci as Record<string, unknown>;
        if (isValidCalendarDate(item.date)) {
          const moodNum = typeof item.mood === 'number' ? Math.round(item.mood) : 3;
          const mood = Math.min(5, Math.max(1, moodNum)) as MoodValue;
          checkIns.push({ date: item.date as string, mood });
        }
      }
    }
  }

  const achievementsUnlocked: string[] = [];
  if (Array.isArray(rawData.achievementsUnlocked)) {
    for (const a of rawData.achievementsUnlocked) {
      if (typeof a === 'string' && a.length > 0 && !achievementsUnlocked.includes(a)) {
        achievementsUnlocked.push(a);
      }
    }
  }

  const puffLog: Record<string, number> = {};
  if (typeof rawData.puffLog === 'object' && rawData.puffLog !== null) {
    const rawLog = rawData.puffLog as Record<string, unknown>;
    for (const [key, val] of Object.entries(rawLog)) {
      if (isValidCalendarDate(key) && typeof val === 'number' && val >= 0) {
        puffLog[key] = Math.round(val);
      }
    }
  }

  let notificationPrefs: NotificationPrefs | undefined;
  if (typeof rawData.notificationPrefs === 'object' && rawData.notificationPrefs !== null) {
    const np = rawData.notificationPrefs as Record<string, unknown>;
    notificationPrefs = {
      morningMotivation: typeof np.morningMotivation === 'boolean' ? np.morningMotivation : true,
      eveningCheckIn: typeof np.eveningCheckIn === 'boolean' ? np.eveningCheckIn : true,
      milestones: typeof np.milestones === 'boolean' ? np.milestones : true,
      dangerHour: typeof np.dangerHour === 'boolean' ? np.dangerHour : true,
      weeklyReport: typeof np.weeklyReport === 'boolean' ? np.weeklyReport : true,
      buddy: typeof np.buddy === 'boolean' ? np.buddy : true,
      morningTime: typeof np.morningTime === 'string' && /^\d{2}:\d{2}$/.test(np.morningTime) ? np.morningTime : '08:00',
    };
  }

  return {
    success: true,
    data: {
      plan,
      relapses,
      cravings,
      checkIns,
      achievementsUnlocked,
      puffLog,
      notificationPrefs,
    },
    warnings,
  };
}
