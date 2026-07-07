/** Relapse compassion-flow copy (BUILD_PROMPT feature 5: "compassion, not shame"). */
import { CravingTrigger } from '@/domain/types';

export const RELAPSE_HEADLINE = 'Slips are part of quitting';

export function relapseBody(lifetimeDays: number): string {
  const dayWord = lifetimeDays === 1 ? 'day' : 'days';
  return `Your ${lifetimeDays} ${dayWord} vape-free still count. Nothing about today erases that. Most people need more than one attempt — what matters is what you do next.`;
}

export interface TriggerOption {
  value: CravingTrigger;
  label: string;
}

export const TRIGGER_OPTIONS: TriggerOption[] = [
  { value: 'stress', label: 'Stress' },
  { value: 'social', label: 'Social situation' },
  { value: 'boredom', label: 'Boredom' },
  { value: 'drinking', label: 'Drinking' },
  { value: 'other', label: 'Something else' },
];

/** Adjusted plan tip, tailored to the logged trigger. */
export function planTipForTrigger(trigger: CravingTrigger): string {
  switch (trigger) {
    case 'stress':
      return 'Stress is your biggest trigger so far. Try the panic button breathing sequence the moment you notice tension building, before the craving peaks.';
    case 'social':
      return "Social situations are tough — plan an exit line or a non-vaping thing to hold (a drink, your phone) before you're around others who vape.";
    case 'boredom':
      return 'Boredom cravings fade fast. Keep a 2-minute distraction ready — a short walk, a text to a friend, or the panic button.';
    case 'drinking':
      return 'Drinking and vaping are strongly linked. Consider setting a lower drink limit on nights out for the next couple weeks while your streak rebuilds.';
    case 'other':
    default:
      return "Whatever it was, you noticed it. That awareness is what makes the next attempt stronger.";
  }
}
