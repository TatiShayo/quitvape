/**
 * Lightweight client-side profanity pre-check for the community composer (BUILD_PROMPT
 * feature 7 / PLAYBOOK "assume trolls from day one"). This is a first line of defense
 * only — it exists so a user gets instant inline feedback instead of a round-trip
 * rejection. The AUTHORITATIVE filter is server-side (see
 * `community_posts_moderate()` in `supabase/migrations/0001_init.sql`); this list is
 * intentionally small/generic and MUST NOT be trusted as the real moderation layer.
 */

const BANNED_WORDS = ['fuck', 'shit', 'bitch', 'cunt', 'nigger', 'faggot'];

export function containsBannedWord(body: string): boolean {
  const lower = body.toLowerCase();
  return BANNED_WORDS.some((word) => lower.includes(word));
}

export interface PostValidationResult {
  valid: boolean;
  reason?: 'empty' | 'too_long' | 'banned_word';
}

export const COMMUNITY_POST_MAX_LENGTH = 280;

/** Pure validation used by both the composer's live feedback and its submit guard. */
export function validateCommunityPost(body: string): PostValidationResult {
  const trimmed = body.trim();
  if (trimmed.length === 0) return { valid: false, reason: 'empty' };
  if (trimmed.length > COMMUNITY_POST_MAX_LENGTH) return { valid: false, reason: 'too_long' };
  if (containsBannedWord(trimmed)) return { valid: false, reason: 'banned_word' };
  return { valid: true };
}
