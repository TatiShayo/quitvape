import { COMMUNITY_POST_MAX_LENGTH, containsBannedWord, validateCommunityPost } from '../profanity';

describe('containsBannedWord', () => {
  it('flags a banned word case-insensitively and mid-string', () => {
    expect(containsBannedWord('This is total SHIT honestly')).toBe(true);
  });

  it('does not flag clean text', () => {
    expect(containsBannedWord('Day 9 and feeling proud of the progress.')).toBe(false);
  });
});

describe('validateCommunityPost', () => {
  it('rejects empty/whitespace-only bodies', () => {
    expect(validateCommunityPost('   ')).toEqual({ valid: false, reason: 'empty' });
  });

  it('rejects bodies over the 280 char cap', () => {
    const long = 'a'.repeat(COMMUNITY_POST_MAX_LENGTH + 1);
    expect(validateCommunityPost(long)).toEqual({ valid: false, reason: 'too_long' });
  });

  it('accepts a body exactly at the cap', () => {
    const exact = 'a'.repeat(COMMUNITY_POST_MAX_LENGTH);
    expect(validateCommunityPost(exact).valid).toBe(true);
  });

  it('rejects a body containing a banned word', () => {
    expect(validateCommunityPost('this is shit').valid).toBe(false);
  });

  it('accepts clean, in-range text', () => {
    expect(validateCommunityPost('Two weeks vape-free today.')).toEqual({ valid: true });
  });
});
