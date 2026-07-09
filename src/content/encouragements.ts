/**
 * Preset-only encouragement replies (BUILD_PROMPT features 7 + 12: "NO free-text
 * replies v1 — kills moderation load" for community; buddy encouragements are "presets
 * only" too, no chat). One fixed list, shared by the community feed and the buddy card
 * — ids must match the `preset_id` check constraint in
 * `supabase/migrations/0001_init.sql` (`community_encouragements`).
 */

export type EncouragementPresetId =
  | 'keep_going'
  | 'proud_of_you'
  | 'you_got_this'
  | 'one_day_at_a_time'
  | 'sending_strength';

export interface EncouragementPreset {
  id: EncouragementPresetId;
  label: string;
}

export const ENCOURAGEMENT_PRESETS: EncouragementPreset[] = [
  { id: 'keep_going', label: 'Keep going' },
  { id: 'proud_of_you', label: 'Proud of you' },
  { id: 'you_got_this', label: 'You got this' },
  { id: 'one_day_at_a_time', label: 'One day at a time' },
  { id: 'sending_strength', label: 'Sending strength' },
];
