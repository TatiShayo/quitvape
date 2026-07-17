# QuitVape — Audit Log (Security & Reliability Hardening Pass)

Audit window: 2026-07-12 → 2026-07-17. Scope: full codebase + Supabase schema/RLS +
coach edge function + analytics/log privacy + client persistence/perf. Detailed
write-ups live in `REVIEW_FINDINGS.md`; this is the ledger of what was found, what
changed, and what is deliberately deferred.

## Found & fixed

| ID | Sev | Finding | Fix |
|---|---|---|---|
| C1 | Critical | Coach edge fn accepted ANY `Authorization` header; "user id" parsed from attacker-controlled token string | JWT verified via `auth.getUser(jwt)`; validated `user.id` is the only identity; 401 otherwise |
| C2 | Critical | No coach rate limit — unbounded Anthropic spend | Migration 0002: `coach_messages` table (no client access) + atomic `consume_coach_quota()` RPC (advisory xact lock); 429 at 10/day, checked before any LLM call |
| H1 | High | Coach user text sent undelimited → prompt injection | Angle brackets stripped, wrapped in `<user_message>` delimiters, system prompt hardened to treat delimited content as data only |
| H2 | High | 5-posts/day trigger was count-then-insert (TOCTOU race) | Migration 0002: `pg_advisory_xact_lock` serializes per-user inserts |
| H3 | High | zustand stores persisted `version: 1` with no `migrate` — any future bump silently wipes streak/relapse/craving history | Explicit `migrate` in all three stores via shared `makeMigrate` helper, field-by-field carry-forward with defaults; unit-tested |
| H4 | High | Cross-user report-abuse chain (see below) | Migration 0003: established-reporter gate + 30 reports/day cap; deny-test regression |
| M1 | Medium | `craving_events.created_at` stored exact insert time, defeating the hour-bucket anonymization promise | Default now `date_trunc('day', now())`; existing rows truncated |
| M2 | Medium | Unlimited buddy invites → multiple pairings, breaks 1:1 model and `getBuddy().maybeSingle()` | `create_buddy_invite()` returns existing open/paired row; `accept_buddy_invite()` refuses already-paired acceptors |
| M3 | Medium | Kill-switch ran after auth; CORS only on OPTIONS; upstream error bodies logged | Kill-switch first; CORS on every response; upstream errors logged as status code only |

## Exploit chain proven (H4): 3 throwaway accounts censor any post

1. Feed visibility rule (RLS + client) auto-hides any post at `report_count >= 3`.
2. `auth.signInAnonymously()` is unlimited and requires no identity — a fresh
   account costs one HTTP call.
3. The 0001 per-reporter PK only dedupes repeat reports from ONE account; it does
   nothing against N sockpuppets.
4. Attack: script three anon sign-ins → each calls `report_post(target)` →
   `report_count = 3` → the victim's post vanishes for every user. Works against
   ANY post, on demand, in seconds. (An earlier review pass had mis-cleared this
   as "OK" because the PK dedup was conflated with the sockpuppet threat.)

**Fix (migration `0003_report_abuse_hardening.sql`):** `report_post()` now counts
only reports from accounts older than 24 h toward `report_count` (raw reports are
still stored for audit), and throttles each reporter to 30 reports/day. Fresh
sockpuppets no longer move the visibility needle; the deny-test
(`supabase/tests/rls_deny_test.sql`) locks in the regression.

## Verified already-safe (read-through, no change needed)

- `community_posts`: no UPDATE/DELETE policies → default-deny; posts immutable by
  author and others; `report_count` writable only through the RPC.
- `craving_events`: insert-own + select-own only.
- `buddies`/`buddy_streaks`/`buddy_encouragements`: pair-private SELECT; writes
  only via security-definer RPCs that re-derive `auth.uid()`.
- All RPCs: `revoke from public`, `grant to authenticated`, `search_path = public`.
- Buddy invite token: 128-bit `gen_random_bytes(16)`, single-use (consumed by
  setting `user_b`).
- Community constraints server-side: 280-char CHECK on `body`, profanity trigger,
  5/day trigger — the client checks are UX mirrors, not the authority.
- Anon session stored in `expo-secure-store` (keychain), not AsyncStorage.
- Privacy invariant: no `console.*`/capture call ships quit/relapse/craving data;
  runtime scrubber drops matching property keys; Sentry `beforeSend` strips
  request bodies; exported bundle grepped for `ANTHROPIC_API_KEY` (absent).

## Performance/reliability added (P1–P5, details in REVIEW_FINDINGS.md)

- P1: notifications rescheduled on every app foreground (AppState listener), not
  just on data changes — OS-dropped schedules and day-boundary drift self-heal.
- P2: per-day streak derivations (milestone ladder, lung stage) memoized on the
  day count instead of recomputing on every 1-second tick.
- P3: Reanimated worklets audited — only shared values captured, never store
  objects; Slider commits to JS once per detent instead of 60–120 calls/s.
- P4: community feed offline cache (instant paint from last snapshot, offline
  notice, live fetch refreshes cache).
- P5: timezone-change streak display correct by construction — calendar-day math
  re-derives from the device timezone every tick, `useNow` refreshes on
  foreground; covered by timezone/DST unit tests.

## Deferred (documented, NEEDS HUMAN)

- Live-DB execution of `rls_deny_test.sql` and rate-limit scripts (requires a
  provisioned Supabase project; no keys on this machine).
- Profanity word list is intentionally minimal (L2) — swap in a maintained list
  before launch; report-to-hide is the real backstop.
- Buddy invite `expires_at` (L1) — accepted for v1; token is shared only by the
  user themselves.
- Analytics event NAMES (`relapse_logged`, `craving_resisted`, no properties)
  reveal feature usage to PostHog against an anonymous id (L3) — the documented,
  deliberate funnel/retention trade-off in `analytics.md`.
- Device/simulator verification (60 fps, notification firing, store sandbox) —
  requires macOS/devices, tracked in PROJECT_STATE.md.

## Gate at audit close

`npx tsc --noEmit`, `npx eslint .`, `npx jest`, and `npx expo export` — results
recorded in PROJECT_STATE.md (Verification gate section) at the end of this pass.
