/**
 * Notification copy (BUILD_PROMPT feature 6 + PLAYBOOK 3.2 lifecycle matrix). Rotating
 * arrays so morning/evening pushes don't feel robotic; index by day-of-year so copy is
 * still deterministic per day (easier to reason about / test) rather than random.
 */

export const MORNING_MOTIVATION_COPY: string[] = [
  'Another day, another win waiting to happen. You\'ve got this.',
  "Good morning. Every hour you don't vape today adds to what you've already built.",
  'Your future self is already proud of today. Go make it official.',
  "Cravings are loud but temporary. You've outlasted every one so far.",
  'Small streaks become identities. Keep stacking days.',
];

export const EVENING_CHECKIN_TITLE = 'How was today?';
export const EVENING_CHECKIN_BODY = 'Log your mood — it takes five seconds and helps us support you better.';

export const DANGER_HOUR_TITLE = 'Rough hour coming up?';
export const DANGER_HOUR_BODY = "This is usually a tough time for you. Take 60 seconds — the panic button is right here.";

export function milestoneNotification(days: number): { title: string; body: string } {
  return {
    title: `${days} day${days === 1 ? '' : 's'} vape-free`,
    body: 'A milestone worth celebrating. Tap to see your progress and share it.',
  };
}

export const WEEKLY_REPORT_TITLE = 'Your week, wrapped';
export const WEEKLY_REPORT_BODY = 'See how many cravings you resisted and how much you saved this week.';

export const RELAPSE_WINBACK_TITLE = 'Your days still count';
export const RELAPSE_WINBACK_BODY =
  'Most people need a few attempts. Start attempt #2 stronger — your plan is ready when you are.';

export function pickMorningCopy(date: Date): string {
  const dayOfYear = Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(date.getFullYear(), 0, 0)) /
      86_400_000,
  );
  return MORNING_MOTIVATION_COPY[dayOfYear % MORNING_MOTIVATION_COPY.length];
}
