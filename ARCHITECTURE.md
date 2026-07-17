# QuitVape — Architecture

A quit-vaping companion app built with Expo React Native. This document is the
map: what the layers are, where data lives, what talks to what, and the security
boundaries that must never be crossed.

## Stack

| Layer | Choice |
|---|---|
| Runtime | Expo SDK 57, React Native, TypeScript (strict) |
| Routing | expo-router (file-based, routes in `app/`) |
| State | zustand + AsyncStorage persist (versioned, with `migrate`) |
| Motion | Reanimated 4 + react-native-gesture-handler |
| Graphics | react-native-svg (streak ring, gauge, lung visual, share cards) |
| Payments | RevenueCat (`react-native-purchases`) behind a provider interface |
| Backend | Supabase (anonymous auth, Postgres + RLS, Edge Functions) |
| AI coach | Supabase Edge Function proxy → Anthropic `claude-haiku-4-5` |
| Analytics | PostHog (scrubbed) + Sentry (scrubbed) |
| Notifications | expo-notifications (local only, no push infra) |

## Layering

```
app/                     expo-router routes — thin: dispatch, navigation, analytics
 ├─ (onboarding)/        age gate → 11-screen quiz → paywall
 ├─ (app)/               tab shell: home, health, community, coach, settings
 └─ panic.tsx            4-7-8 breathing overlay (modal, signature interaction)

src/
 ├─ domain/              PURE functions, zero RN imports, fully unit-tested
 │    streak/time/money/taper/dependency/dangerHour/weeklyReport/achievements
 │    profanity (client mirror of the server filter), anonHandle, hotlines
 ├─ store/               zustand stores (quitStore, settingsStore, onboardingStore)
 │    persist.ts         shared versioned-persist helper: every store has an explicit
 │                       `migrate` so a version bump can never wipe streak data
 ├─ app-core/            hooks/services gluing domain+store+providers to screens
 │    notifications.ts   idempotent local-notification scheduler (cancel-by-id first)
 │    useNow.ts          ticking clock, pauses when backgrounded
 │    useBuddy.ts        buddy pairing/streak sync, poll-on-foreground
 │    communityCache.ts  offline snapshot of the public feed (AsyncStorage)
 ├─ providers/           typed interfaces + mock/real implementations
 │    analytics/         PostHog + Sentry with a runtime PII scrubber
 │    backend/           Supabase client + mockBackend (used when keys absent)
 │    purchases/         RevenueCat + mock (auto-grants entitlement in dev)
 ├─ ui/                  themed primitives (Button, Card, Slider, Gauge, Odometer,
 │                       StreakRing, LungVisual, QuizProgress, CheckInPrompt…)
 ├─ content/             copy: quiz, notifications, encouragement presets, coaching
 └─ theme/               midnight-premium tokens: colors, spacing, type, springs

supabase/
 ├─ migrations/          0001 schema+RLS, 0002 security hardening, 0003 report-abuse
 ├─ functions/coach/     Deno edge function (Anthropic proxy)
 └─ tests/               rls_deny_test.sql (cross-user deny assertions)
```

**Dependency rule:** `domain/` imports nothing above it. Screens never import
Supabase/PostHog/RevenueCat SDKs directly — always through `src/providers/*`
interfaces, which fall back to mocks when env keys are absent, so the full app
is walkable on a fresh clone with zero configuration.

## Data topology (the privacy invariant)

Health-adjacent data is **local-first**. The invariant, enforced in code:

> Nothing that identifies a user's quit/relapse/craving history ever reaches
> PostHog, Sentry, server logs, or any table joinable to identity.

- **On device only:** quit date, streak start, relapse timestamps, mood
  check-ins, puff logs, quiz answers, achievements. Persisted via zustand →
  AsyncStorage. Deleted locally + `delete_all_my_data()` RPC server-side.
- **Anonymized server-side:** `craving_events` rows carry only an hour bucket
  and coarse fields; `created_at` is truncated to the day (migration 0002) so
  timing correlation with community posts is impossible. Insert+select-own only.
- **Pseudonymous server-side:** community posts (generated anon handle, body,
  streak-day badge), buddy pairing + streak day counts. All under anonymous
  Supabase auth — no email, name, or contact info exists anywhere.
- **Analytics:** event names only (documented in `analytics.md`). A runtime
  scrubber (`src/providers/analytics/index.ts`) drops any property whose key
  matches `relapse|craving|trigger|quit_date|mood|handle|note|body|message`;
  Sentry `beforeSend` strips request bodies. Session token lives in
  `expo-secure-store` (device keychain), not AsyncStorage.

## Security boundaries

1. **RLS is the authority.** Every table has row-level security; client checks
   (profanity, length, rate) are UX-only mirrors of server triggers.
   `community_posts` has no UPDATE/DELETE policy at all (immutable);
   `report_count` is writable only via the `report_post()` security-definer RPC.
2. **All RPCs** `revoke from public / grant to authenticated`, pin
   `search_path = public`, and re-derive identity from `auth.uid()` — never
   from arguments.
3. **Race-free rate limits.** 5 posts/day and 10 coach messages/day are
   enforced with `pg_advisory_xact_lock` (no count-then-insert TOCTOU).
4. **Report abuse resistance** (migration 0003): only reports from accounts
   older than 24 h count toward the 3-report auto-hide, and each reporter is
   capped at 30 reports/day — three throwaway anon accounts can no longer
   censor an arbitrary post.
5. **Coach edge function order of operations:** kill-switch env check →
   JWT verification (`auth.getUser`) → input validation → atomic quota RPC →
   Anthropic call with `max_tokens: 200` → 120-word reply cap. User text is
   angle-bracket-stripped and wrapped in `<user_message>` delimiters; the
   system prompt treats delimited content strictly as data. `ANTHROPIC_API_KEY`
   exists only as an edge-function secret, never in the bundle (verified by
   grepping `dist/` after export).
6. **Buddy privacy:** pair-private SELECT policies; invite tokens are 128-bit
   random and single-use (consumed when `user_b` is set).

## Reliability & performance decisions

- **Persist migrations:** all three stores declare explicit `migrate` functions
  carrying state field-by-field with defaults — a version bump degrades
  gracefully instead of wiping the streak (the worst possible data loss here).
- **Notifications** are rescheduled idempotently (stable ids, cancel-first) on
  plan/craving changes AND on every app foreground, since iOS/Android can drop
  scheduled locals and day boundaries shift while backgrounded.
- **Streak math** distinguishes ELAPSED time (live counter) from LOCAL CALENDAR
  days (streak days), making DST and timezone changes correct by construction:
  day counts re-derive from the device's current timezone on every tick, and
  `useNow` refreshes immediately on foreground (post-flight timezone jumps show
  the right streak on resume). Per-day derivations (milestone ladder, lung
  stage) are memoized on the day count, not recomputed on 1-second ticks.
- **Worklets** capture only shared values — never store objects — so gesture
  frames stay off the JS thread; the quiz Slider commits to JS once per detent
  instead of per frame.
- **Community feed** paints from an AsyncStorage snapshot instantly and stays
  readable offline; a live fetch replaces it and refreshes the cache.

## Verification gate

`npx tsc --noEmit` + `npx eslint .` + `npx jest` must be green and
`npx expo export` must bundle cleanly before any commit is considered done.
Security regressions are covered by `supabase/tests/rls_deny_test.sql`
(cross-user deny + report-abuse chain) and the coach/store unit tests.
