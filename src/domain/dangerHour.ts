/**
 * Danger-hour detection (BUILD_PROMPT feature 6): "most cravings logged 9-11pm ->
 * schedule support ping 8:45pm". Pure function over the local craving log, bucketed by
 * local hour-of-day. Requires a minimum sample size so a single early craving doesn't
 * pin the danger hour to a fluke.
 */
import { CravingEvent } from './types';

const MIN_SAMPLE_SIZE = 3;
/** Minutes before the peak hour to schedule the support ping. */
export const DANGER_HOUR_LEAD_MINUTES = 15;

/**
 * Returns the local hour (0-23) with the most logged cravings, or undefined if there
 * isn't enough data yet to be meaningful.
 */
export function detectDangerHour(cravings: CravingEvent[]): number | undefined {
  if (cravings.length < MIN_SAMPLE_SIZE) return undefined;

  const counts = new Array(24).fill(0) as number[];
  for (const c of cravings) {
    const d = new Date(c.ts);
    if (Number.isNaN(d.getTime())) continue;
    counts[d.getHours()] += 1;
  }

  let bestHour = -1;
  let bestCount = 0;
  for (let h = 0; h < 24; h++) {
    if (counts[h] > bestCount) {
      bestCount = counts[h];
      bestHour = h;
    }
  }
  // Require the peak hour to have at least 2 cravings — a flat/uniform distribution
  // over few samples shouldn't be treated as a signal.
  if (bestHour === -1 || bestCount < 2) return undefined;
  return bestHour;
}

/** Support-ping local time (HH:mm), a lead window before the detected danger hour. */
export function dangerHourPingTime(dangerHour: number): { hour: number; minute: number } {
  const totalMinutes = dangerHour * 60 - DANGER_HOUR_LEAD_MINUTES;
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  return { hour: Math.floor(normalized / 60), minute: normalized % 60 };
}
