/**
 * Coaching domain: pure functions for the AI coach (word capping, etc).
 * Tested in-isolation; the Supabase edge function re-uses the same logic.
 */

/**
 * Cap a coach response to 120 words max. Used both in the edge function
 * and in test validation to ensure the contract is met.
 * @param text The coach's response text
 * @returns Text capped at 120 words with '...' appended if trimmed
 */
export function capCoachResponse(text: string): string {
  const words = text.split(/\s+/);
  if (words.length <= 120) {
    return text;
  }
  return words.slice(0, 120).join(' ') + '...';
}

/**
 * Validate that user input is within acceptable bounds.
 * @param message User's raw input
 * @returns Trimmed and validated message, or undefined if invalid
 */
export function validateCoachInput(message: string): string | undefined {
  const trimmed = message.trim();
  if (!trimmed || trimmed.length === 0) {
    return undefined;
  }
  if (trimmed.length > 1000) {
    return trimmed.slice(0, 1000);
  }
  return trimmed;
}
