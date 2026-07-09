import { REVIEW_PROMPT_STREAK_DAY, shouldPromptForReview } from '../reviewPrompt';

describe('shouldPromptForReview', () => {
  it('does not prompt before the 7-day streak', () => {
    expect(shouldPromptForReview(0, false)).toBe(false);
    expect(shouldPromptForReview(1, false)).toBe(false);
    expect(shouldPromptForReview(6, false)).toBe(false);
  });

  it('prompts exactly at the 7-day streak', () => {
    expect(shouldPromptForReview(REVIEW_PROMPT_STREAK_DAY, false)).toBe(true);
  });

  it('prompts once the streak is past 7 days (e.g. app opened first on day 9)', () => {
    expect(shouldPromptForReview(9, false)).toBe(true);
    expect(shouldPromptForReview(30, false)).toBe(true);
  });

  it('never prompts again once it has already fired', () => {
    expect(shouldPromptForReview(7, true)).toBe(false);
    expect(shouldPromptForReview(365, true)).toBe(false);
  });

  it('is not eligible after a relapse resets the current streak below 7', () => {
    // A user hits 12 days, relapses -> current streak is now e.g. 0 or 2. Because we key
    // on the *current* streak, eligibility drops back to false: a relapse can never fire it.
    expect(shouldPromptForReview(0, false)).toBe(false);
    expect(shouldPromptForReview(2, false)).toBe(false);
  });
});
