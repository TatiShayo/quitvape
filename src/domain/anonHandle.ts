/**
 * Pure "QuittingEagle42"-style anon handle generation (BUILD_PROMPT feature 7). The
 * real backend generates handles server-side (see `supabase/migrations/0001_init.sql`
 * `generate_anon_handle()`) so a client can never spoof one on a real post — this
 * mirrors that word-list scheme for the mock backend and any client-side preview UI.
 */

const ADJECTIVES = [
  'Quitting', 'Steady', 'Calm', 'Brave', 'Rising',
  'Clear', 'Fresh', 'Bold', 'Quiet', 'Strong',
];

const NOUNS = [
  'Eagle', 'Otter', 'Heron', 'Falcon', 'Wolf',
  'Fox', 'Sparrow', 'Tiger', 'Hawk', 'Bear',
];

/** Simple deterministic string hash (djb2) — no crypto needed, just an even spread. */
function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return Math.abs(hash >>> 0);
}

/** Deterministic handle from any stable seed (e.g. a user/session id). */
export function generateAnonHandle(seed: string): string {
  const n = hashString(seed);
  const adjective = ADJECTIVES[n % ADJECTIVES.length];
  const noun = NOUNS[Math.floor(n / 97) % NOUNS.length];
  const num = Math.floor(n / 9973) % 100;
  return `${adjective}${noun}${num}`;
}

/** Non-deterministic convenience wrapper for previews where no stable seed exists yet. */
export function randomAnonHandle(): string {
  return generateAnonHandle(`${Date.now()}-${Math.random()}`);
}
