# QuitVape — Security & Reliability Review Findings

Reviewed: 2026-07-12. Scope: Supabase migration + RLS, coach edge function, buddy
system, community moderation, analytics/log privacy, client persistence/reliability.
Status column updated as fixes land in this session.

## CRITICAL

### C1 — Coach edge function performs no JWT verification (auth bypass + cost abuse)
`supabase/functions/coach/index.ts` only checks that *any* `Authorization` header is
present, then calls the Anthropic API. Any unauthenticated caller (curl with
`Authorization: x`) burns paid tokens. The "user id" was derived by string-splitting
the raw bearer token (`authHeader.replace('Bearer ', '').split('|')[0]`) — not a
validated identity; it is attacker-controlled.
**Fix:** validate the JWT with `supabase.auth.getUser(jwt)` (anon-key client) and use
the returned `user.id` for everything. Reject with 401 otherwise. **FIXED.**

### C2 — Coach edge function has no rate limit (unbounded LLM spend)
The 10 messages/day cap was a `TODO`; no `coach_messages` table existed. One user (or
one script, combined with C1) could make unlimited Anthropic calls.
**Fix:** migration `0002` adds `coach_messages` (RLS: no direct client access) and an
atomic `consume_coach_quota()` security-definer RPC using a per-user advisory
transaction lock (no count-then-insert race). Edge function calls it (service-role)
before touching Anthropic and returns 429 when exhausted. **FIXED.**

## HIGH

### H1 — Coach user text sent undelimited (prompt injection)
The user message was passed verbatim as the user turn with no delimiters and no
system-prompt instruction to treat it as data (PLAYBOOK 2.6). A crafted message could
steer the coach off its guardrails ("ignore your instructions...").
**Fix:** message wrapped in explicit `<user_message>` delimiters (angle brackets
stripped from the payload first so the delimiter cannot be forged), and the system
prompt now instructs the model to treat delimited content strictly as data, never as
instructions, and to refuse instruction-like content. **FIXED.**

### H2 — Community 5-posts/day rate limit is racy
`community_posts_rate_limit()` did `SELECT count(*)` then allow — two concurrent
inserts both read 4 and both commit (classic TOCTOU). Same class of race for any
burst poster.
**Fix:** migration `0002` replaces the trigger function to take
`pg_advisory_xact_lock(hashtext('community_posts_rate:' || user_id))` before
counting, serializing per-user inserts. **FIXED.**

### H3 — zustand persisted state (streak!) dropped on any future version bump
All three stores persist with `version: 1` and **no `migrate`**. zustand discards the
persisted state when the stored version differs and no migrate is provided — a future
schema bump (or a downgrade/corrupt payload) would silently wipe the user's quit
date, relapses, cravings and achievements: the single worst data-loss event this app
can have.
**Fix:** all three stores (`quitStore`, `settingsStore`, `onboardingStore`) now
declare an explicit `migrate` that carries persisted state forward field-by-field
with defaults, so unknown/older versions degrade gracefully instead of wiping.
**FIXED.**

## MEDIUM

### M1 — `craving_events.created_at` defeats the hour-bucket anonymization
The table comment promises "timestamp bucketed to the hour so it can't be correlated
... by timing", yet `created_at timestamptz default now()` stores the exact insert
instant — trivially correlatable with a community post or buddy event.
**Fix:** migration `0002` changes the default to `date_trunc('day', now())` and
truncates existing rows; the precise time never reaches the server (the client only
sends `hour_bucket`). **FIXED.**

### M2 — Unlimited buddy invites / multiple pairings break the 1:1 model
`create_buddy_invite()` inserted unconditionally: a user could hold many open invites
and end up in multiple pairings, which (a) contradicts the 1-buddy product model and
(b) breaks the client (`getBuddy()` uses `.maybeSingle()`, which errors on >1 row,
making the buddy feature appear permanently broken for that user).
**Fix:** migration `0002` replaces the RPC to return the existing open/paired row if
one exists instead of inserting a duplicate, and `accept_buddy_invite()` now refuses
acceptors who are already paired. **FIXED.**

### M3 — Coach reply/config hygiene (kill-switch ordering, CORS, error detail)
Kill-switch was evaluated after the auth check (still cost-free, but the spec is
kill-switch-first so a panic disable short-circuits everything); CORS headers were
only sent on OPTIONS (browser calls would fail opaquely); upstream Anthropic error
bodies were logged wholesale.
**Fix:** kill-switch is now the first check; shared CORS headers on every response;
upstream errors logged as status code only. Reply word-cap (120) and
`max_tokens: 200` retained. **FIXED.**

## LOW / ACCEPTED

### L1 — Buddy invite token: adequate entropy, but lives forever
`invite_token` is `gen_random_bytes(16)` hex (128 bits) — not guessable, and
`accept_buddy_invite` marks it used by setting `user_b` (not replayable). However an
unaccepted invite never expires. Accepted for v1 (token only ever shared by the user
themselves via the share sheet); revisit with an `expires_at` if invite links are
ever posted publicly. **ACCEPTED (documented).**

### L2 — Profanity word list is intentionally minimal
Server trigger + client check share a tiny generic list; trivially bypassed with
leetspeak/unicode. Already flagged NEEDS HUMAN in the migration: swap in a maintained
list before launch. Report-to-hide (3 reports, enforced in RLS `USING`) is the real
moderation backstop. **ACCEPTED (documented, NEEDS HUMAN).**

### L3 — Analytics event *names* reveal feature usage
`relapse_logged` / `craving_resisted` events (no properties) are sent to PostHog
against an anonymous id. This is the documented, deliberate trade-off in
`analytics.md` (funnel/retention measurement); no quit dates, streak values, notes,
moods, triggers or handles are ever attached — the runtime scrubber
(`src/providers/analytics/index.ts`) drops any property key matching
`relapse|craving|trigger|quit_date|mood|handle|note|body|message`, and Sentry's
`beforeSend` strips request bodies. Verified by grep: no `console.*` or capture call
ships health payloads. **ACCEPTED (documented).**

### L4 — Anon session storage
Supabase session is stored in `expo-secure-store` (device keychain), not
AsyncStorage — verified in `src/providers/backend/supabaseClient.ts`. **OK.**

### L5 — RLS posture verified by read-through
- `community_posts`: no UPDATE/DELETE policies exist → default-deny; posts are
  immutable by others *and* by the author. `report_count` is only writable via the
  `report_post()` RPC, which recounts from `post_reports` (PK dedupes one report per
  user) — not inflatable by repeat calls. **OK.**
- `craving_events`: insert-own + select-own only; no update/delete. **OK.**
- `buddies` / `buddy_streaks` / `buddy_encouragements`: pair-private SELECT policies;
  writes only via security-definer RPCs that re-derive identity from `auth.uid()`.
  **OK.**
- All RPCs `revoke ... from public; grant ... to authenticated` and set
  `search_path = public`. **OK.**
- Remaining gap: the automated deny-test still requires a live Supabase project
  (NEEDS HUMAN, tracked in PROJECT_STATE.md).
