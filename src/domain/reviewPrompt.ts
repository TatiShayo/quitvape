/**
 * Pure decision logic for the smart review prompt (BUILD_PROMPT feature 15).
 * Kept dependency-free (no RN/expo imports) so it is unit-testable in the domain suite.
 */

/** Streak day at which we ask for a review — the product's peak-happiness moment. */
export const REVIEW_PROMPT_STREAK_DAY = 7;

/**
 * The prompt is eligible only when it has never fired AND the *current* streak has
 * reached the 7-day mark. Because it keys on the live current streak (which a relapse
 * resets to 0), a relapse can never make the prompt eligible — the caller passes the
 * current streak, so an in-progress relapse simply drops eligibility back to false.
 */
export function shouldPromptForReview(currentStreakDays: number, alreadyPrompted: boolean): boolean {
  if (alreadyPrompted) return false;
  return currentStreakDays >= REVIEW_PROMPT_STREAK_DAY;
}
