/**
 * Smart review prompt (BUILD_PROMPT feature 15 + PLAYBOOK 4.4): expo-store-review
 * fired EXACTLY ONCE, at the 7-day streak celebration — the product's peak-happiness
 * moment. Never after a relapse and never during a craving flow.
 *
 * Guarantees:
 * - Fires only once ever (persisted `reviewPrompted` flag in the settings store).
 * - Fires only when the *current* streak has reached the 7-day milestone, so a user who
 *   relapses before day 7 and starts over is judged on their new streak — a relapse can
 *   never be the thing that triggers the prompt.
 * - This hook is mounted only on the Home screen, never on the panic/relapse/craving
 *   screens, so it is structurally impossible to fire mid-craving or on the relapse flow.
 * - `hasAction()` is checked so we never no-op-burn the one-shot flag on a platform/build
 *   where the native review dialog is unavailable (it stays available for a later day).
 */
import { useEffect } from 'react';
import * as StoreReview from 'expo-store-review';
import { useSettingsStore } from '@/store';
import { getErrors } from '@/providers';
import { shouldPromptForReview } from '@/domain/reviewPrompt';

export { REVIEW_PROMPT_STREAK_DAY } from '@/domain/reviewPrompt';

export function useReviewPrompt(currentStreakDays: number): void {
  const reviewPrompted = useSettingsStore((s) => s.reviewPrompted);
  const markReviewPrompted = useSettingsStore((s) => s.markReviewPrompted);

  useEffect(() => {
    if (!shouldPromptForReview(currentStreakDays, reviewPrompted)) return;

    let cancelled = false;
    (async () => {
      try {
        // hasAction() also respects the OS-level review throttle, so we never burn the
        // one-shot flag when the native dialog wouldn't actually show — the ask survives
        // to a later day on a real device.
        const available = await StoreReview.hasAction();
        if (cancelled || !available) return;
        await StoreReview.requestReview();
        if (!cancelled) markReviewPrompted();
      } catch (e) {
        // A failed review request must never crash the home screen or retry-loop.
        getErrors().captureException(e, { where: 'useReviewPrompt' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentStreakDays, reviewPrompted, markReviewPrompted]);
}
