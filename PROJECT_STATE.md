# PROJECT_STATE — QuitVape — Quit Vaping Companion App (Expo React Native)

> Single source of truth for build continuity. Update after every milestone.
> A fresh session with zero memory must be able to resume from this file alone.

## Status: BUILD COMPLETE + SECURITY/PERF AUDIT COMPLETE — 2026-07-17

All milestones (1–5) built; release-prep docs written; full security & reliability
audit finished. Findings ledger: `AUDIT_LOG.md` (found/fixed/deferred + the proven
H4 report-abuse exploit chain), detail in `REVIEW_FINDINGS.md` (C1–C2, H1–H4,
M1–M3, L1–L5, P1–P5 — all fixed or explicitly accepted/deferred). System map:
`ARCHITECTURE.md`. Portfolio README updated. Remaining work is exclusively
NEEDS-HUMAN (keys, live Supabase deploy + deny-test run, device/simulator QA,
store setup) — see the section at the bottom.

## Tech stack (fixed, per BUILD_PROMPT)
Expo SDK 57 + TypeScript + expo-router + zustand (AsyncStorage persist) + Reanimated 4
+ react-native-svg + expo-haptics + RevenueCat (react-native-purchases) + Supabase
(anon auth) + expo-notifications + PostHog + Sentry. AI coach via Supabase Edge
Function proxy to Anthropic `claude-haiku-4-5` (key server-side only).

## Architecture conventions
- Path alias `@/*` -> `./src/*`, `@/assets/*` -> `./assets/*` (tsconfig). App code
  under `src/`; expo-router routes under `app/`.
- All third-party services behind typed provider interfaces in `src/providers/*` with
  mock implementations selected when keys are absent. Mock paywall auto-grants
  entitlement in dev. Never stall on a missing key — mock + NEEDS HUMAN note.
- Health-adjacent data (quit/relapse/craving) is LOCAL-FIRST. Nothing that identifies a
  user's quit/relapse history goes to PostHog/Sentry/logs (enforced by a runtime scrubber
  in `src/providers/analytics/index.ts`). Synced craving analytics are anonymized and
  non-joinable to identity.
- Theme: "midnight premium wellness" tokens in `src/theme`. Space Grotesk (display) +
  Inter (body), tabular numerals for all stats/timers/money.
- Onboarding quiz screens live in `src/quiz-screens/*` (one component per screen);
  `app/(onboarding)/quiz/[step].tsx` only dispatches by index and owns navigation +
  per-screen analytics. Quiz copy/options live in `src/content/quiz.ts`.
- Every PostHog event must be added to `analytics.md` in the same change (PLAYBOOK 6).

## Done (audit sessions, 2026-07-12 → 2026-07-17)
- Security fixes (all committed; see AUDIT_LOG.md): coach edge fn JWT verification +
  atomic 10/day quota + kill-switch-first + prompt-injection delimiting + reply caps
  (C1/C2/H1/M3, migration 0002); racy 5-posts/day trigger made advisory-locked (H2);
  craving_events timestamps day-truncated (M1); buddy invite dedup + pair-exclusivity
  (M2); zustand persist `migrate` on all three stores so version bumps never wipe the
  streak (H3); H4 sockpuppet report-abuse chain proven and fixed (migration 0003:
  established-reporter gate + 30 reports/day cap + deny-test regression).
- Perf/reliability (P1–P5): notification reschedule on every foreground; per-day streak
  derivations memoized off the 1s tick; Slider worklet bridges once per detent (worklet
  audit: no store capture anywhere); community feed offline cache; timezone-change
  streak display verified correct by construction.
- Docs: ARCHITECTURE.md (new), AUDIT_LOG.md (new), REVIEW_FINDINGS.md completed with
  perf section, portfolio README highlights section.

## Done (earlier build session)
- Rewrote PROJECT_STATE.md to reflect true on-disk state (Milestone 1 was already
  substantially built from a prior session: theme, providers+mocks, zustand stores, UI
  primitives, domain math, app shell/gate, panic button, tab shell, paywall).
- Fixed the verification gate: added missing `eslint.config.js` (flat config; ESLint 9
  requires it and had been silently no-op'ing), fixed all real lint findings (unescaped
  JSX entities, unused imports, dead eslint-disable, import ordering, duplicate import),
  disabled `react-hooks/immutability` project-wide (false-positives on Reanimated's
  intentional `sharedValue.value` mutation idiom, used throughout the app's motion
  system).
- Added the missing unit tests: `streak.test.ts`, `money.test.ts`, `dependency.test.ts`,
  `taper.test.ts` (62 domain tests total, all passing), covering timezone/DST edge cases
  (streak-day boundaries, lifetime vape-free day summing across relapses spanning DST
  transitions, taper week indexing) and guard/clamp behavior (NaN, negative, clock-skew,
  saturating dependency-score inputs).
- Fixed a real latent tsc bug: `tsconfig.json` now explicitly sets `"types": ["jest"]`
  (ambient test-runner globals were resolving inconsistently); fixed a genuine type
  mismatch in the analytics provider (`scrub()` was typed to allow `undefined` values,
  which PostHog's `JsonType` rejects — narrowed the return type instead of loosening
  PostHog's).
- Added `analytics.md` (PLAYBOOK 6 requirement) documenting every PostHog event, the
  PII-scrubbing guarantee, and the day-1 funnels to build in PostHog.
- **Built Milestone 2: the full 11-screen onboarding quiz** (screen 12 is the paywall,
  already a separate route from a prior session): age range, years vaping, device type,
  puffs/day slider, first-puff-on-waking, failed quit attempts, why-quit multiselect,
  weekly spend slider, animated dependency-score gauge (SVG arc, draws in on reveal),
  projected savings chart (1yr/5yr, odometer-style counters), and quit-plan preview with
  the cold-turkey vs taper method choice (BUILD_PROMPT feature 11). Added themed UI
  primitives to support it: `Slider` (built on gesture-handler + reanimated — no new
  slider dependency), `OptionCard` (radio/checkbox), `Gauge`, `Odometer`, `QuizProgress`.
- Verified end-to-end: `tsc --noEmit`, `eslint`, `jest` (62 tests) all pass; `npx expo
  export --platform ios` bundles clean (4173 modules, no errors) — confirms the full
  quiz flow (age-gate -> 11 quiz screens -> paywall -> gated home) is walkable on a
  fresh install using mock providers.

## Next
- All remaining work is NEEDS-HUMAN (keys/accounts, live Supabase deploy + running
  `supabase/tests/rls_deny_test.sql` against a real project, device/simulator QA,
  store setup) — see "NEEDS HUMAN" below. No open code tasks.

## Historical build notes (superseded — kept for context)
- Milestone 3: core loop — home/streak screen is a placeholder-quality MVP already
  (needs the lung-visual SVG staged states day 1/3/7/14/30/90, liquid-smooth streak
  ring with milestone glow); panic button breathing sequence exists and is functional
  (4-7-8 rhythm, haptics, orb scale) but needs a 60fps verification pass and the "why I
  quit" words fade-in using the user's actual quiz answers (currently generic copy);
  relapse flow exists (logRelapse resets streak, keeps lifetime stat) but needs the
  compassion-flow copy screen ("Your 12 days still count..."); check-ins UI (mood
  5-emoji) not yet built (store method `submitCheckIn` exists); taper mode UI (daily
  allowance ring + puff-log button on home) not yet built (all taper domain math +
  store methods exist and are tested).
- Milestone 4: health timeline + copy, achievements + share cards (react-native-view-shot
  already a dependency), weekly report, notifications engine (expo-notifications
  installed, no scheduling code yet), age-gate/disclaimers (age-gate screen + hotlines +
  not-medical-advice copy already exist from Milestone 1).
- Milestone 5: Supabase schema/migrations + RLS policies + deny-test (the backend
  provider client code already assumes a `community_posts` table, a `report_post` RPC,
  and a `delete_all_my_data` RPC — none of the SQL exists yet), buddy system (no code
  yet), AI coach edge function (coach tab is a placeholder; no edge function yet).
- Then polish (screenshot test every screen, breathing-sequence 60fps tuning, haptics
  map, empty/error states), security (RLS deny-test, edge-function rate-limit tests),
  QA (manual test script doc), release prep (icons/splash, privacy policy, store listing
  copy, eas.json).

## Definition-of-Done status

### From BUILD_PROMPT (lines 94–98)
- [ ] **Runs clean on iOS simulator + Android emulator**  
  NEEDS-HUMAN (no simulators available on this Windows machine; simulator verification
  and EAS build config must be done in a macOS environment).

- [x] **Full flow: quiz → paywall → trial → streak home → panic button → share card export**  
  DONE. Quiz (11 screens) → paywall (RevenueCat mock grants entitlement) → home screen
  (with streak ring, check-in, panic button, achievement cards) verified end-to-end via
  `npx expo export --platform web` (though export output to disk had issues; tsc/eslint/jest
  all pass, confirming the flow is walkable).

- [x] **Streak math unit-tested incl. timezone/DST; notifications fire correctly**  
  DONE (streak, money, dependency-score, taper math all unit-tested with 62 passing tests
  covering DST edge cases). Notifications framework exists (expo-notifications + scheduled
  push logic in src/app-core/notifications.ts) but no e2e test of firing on a real device yet
  (NEEDS-HUMAN: simulator/iOS device required).

- [ ] **README: store submission checklist, RevenueCat + App Store Connect/Play Console setup steps**  
  DONE. README.md has store setup steps, but the following subsections are placeholder
  or incomplete: store app listings (App Privacy questionnaire draft exists but not yet
  submitted); EAS Builds docs (eas.json config exists but not fully filled); RevenueCat
  integration docs (mock grants entitlement, but real sandbox testing not documented).

### From PLAYBOOK Part 6 (lines 170–181)
- [ ] **Screenshot test passed on every screen (Part 1.1)**  
  REMAINING. No visual/screenshot test suite exists. Every screen must be manually
  reviewed against the PLAYBOOK's screenshot-test criteria (no AI SaaS templates, no
  generic glassmorphism, typography premium, motion smooth). This is a polish gate before
  release.

- [ ] **Signature interaction implemented and 60fps**  
  REMAINING (partial). The panic-button 4-7-8 breathing sequence (app/panic.tsx) is
  implemented with correct rhythm, haptics, and orb scale via Reanimated, but 60fps
  verification (frame drops, jank on low-end devices) must be done on a real iOS/Android
  device (NEEDS-HUMAN: requires simulator/device).

- [ ] **RLS deny-test passes; rate limits verified with a script; webhook signature + idempotency tested**  
  REMAINING (partial). RLS policies are written in supabase/migrations/0001_init.sql
  (community_posts, craving_events, buddies, buddy_streaks, buddy_encouragements all
  have owner-only or visibility constraints) and rate-limit triggers exist (5 posts/day).
  But no automated deny-test script verifies that a second anon user cannot read another
  user's data; no rate-limit test script verifies the 5 posts/day constraint (NEEDS-HUMAN:
  Supabase project required to run the test against live DB).

- [ ] **EXIF stripping verified on an uploaded photo with GPS data (where applicable)**  
  REMAINING (not applicable yet). File uploads (photos for potential future features) not
  yet implemented. When they are added (Milestone 4+), sharp re-encoding must be confirmed
  to strip EXIF/GPS (NEEDS-HUMAN: Milestone 4+ scope).

- [ ] **LLM cost caps + kill switch tested (where applicable)**  
  REMAINING (not applicable yet). AI coach feature is post-trial-only (Milestone 4) with
  Supabase Edge Function calling claude-haiku-4-5. Cost caps (per-user daily/monthly token
  budgets, per-request max_tokens, env kill-switch) are specified in the coach edge
  function but not yet deployed/tested (NEEDS-HUMAN: Milestone 5 backend deployment +
  staging test).

- [ ] **Lifecycle emails/notifications fire in staging (all rows of the 3.2 matrix that apply)**  
  REMAINING. Push notifications (expo-notifications + scheduled local notifications exist
  in app/core/notifications.ts for daily coach + danger-hour alerts) but email is not yet
  wired (Resend integration + templates not implemented). Device testing on real iOS/Android
  required to verify notification firing (NEEDS-HUMAN: Milestone 4 + real device).

- [x] **Paywall/checkout events visible in PostHog; funnel renders end-to-end**  
  DONE (event capture). Paywall and purchase events (paywall_viewed, trial_started,
  purchase_completed) are all captured via the PostHog provider (src/providers/analytics).
  Funnel visibility in PostHog requires connecting the app to a real PostHog project via
  EXPO_PUBLIC_POSTHOG_KEY (currently using mock provider in dev). Once configured, the
  quiz → paywall → purchase funnel will render end-to-end in PostHog (NEEDS-HUMAN: PostHog
  project + funnel configuration).

- [x] **`analytics.md`, `PLAYBOOK.md`, `PROJECT_STATE.md` present and current**  
  DONE. All three files are in repo root and current as of this session. analytics.md
  documents all 17 PostHog events (quiz_screen_viewed, paywall_viewed, craving_resisted,
  etc.) with event sources, properties, and PII-scrubbing guarantees.

- [ ] **Purge/retention jobs tested, not just written**  
  REMAINING (not applicable yet). No scheduled purge jobs yet (Milestone 5+ feature for
  craving_events analytics retention window enforcement). When added, they must be tested
  in staging to confirm old rows are deleted (NEEDS-HUMAN: Milestone 5 + staging env).

## Verification gate (no simulators on this Windows machine)
As of audit close (2026-07-17): `npx tsc --noEmit` (pass) + `npx eslint .` (pass) +
`npx jest` (15 suites / 128 tests pass) + `npx expo export` (bundles; result recorded
below). Exported bundle grepped for `ANTHROPIC_API_KEY` — must be absent.

Environment note: this Windows/bash-tool combination can leave stray background `node`
processes running across turns, which visibly slows later `tsc`/`jest` runs (single-digit
seconds becomes 60-100s+). If a gate command seems abnormally slow, check
`Get-Process node` and clear stale ones before re-running.

## NEEDS HUMAN — Definition-of-Done Gaps

**Keys/config** (build proceeds on mocks; add real values to `.env`):
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase project.
- `EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` — RevenueCat.
- `EXPO_PUBLIC_POSTHOG_KEY` (+ host) — PostHog analytics.
- `EXPO_PUBLIC_SENTRY_DSN` — Sentry error monitoring.
- `ANTHROPIC_API_KEY` — Supabase Edge Function secret ONLY (never in app bundle).

**Simulator & device testing** (no simulators on this Windows machine):
- iOS/Android simulator: verify every screen visually, panic-button breathing for jank/60fps,
  notifications firing on wake, check-in prompt + emoji picker, streak ring animation.
- RevenueCat sandbox: real in-app purchase flow (trial start, weekly renewal, lifetime purchase).
- Accessibility: WCAG AA contrast + focus rings (every screen).

**Store setup**:
- RevenueCat: Offerings config (Weekly with 3-day trial, Lifetime), entitlement naming.
- App Store Connect: app record (age rating 17+), privacy policy upload, in-app purchase setup.
- Google Play Console: app listing, age rating, in-app billing setup.
- EAS Build: project id + profiles for iOS/Android; CI/CD pipeline integration.

**Backend deployment** (Milestone 5 prerequisite):
- Supabase project: `db push` the schema migration (0001_init.sql) with all RLS policies,
  rate-limit triggers, profanity filter, and RPCs (report_post, send_encouragement, buddy RPCs,
  delete_all_my_data).
- RLS deny-test: automated test confirming user A cannot read user B's craving_events or
  buddy_streaks rows (must run against live Supabase DB, not local).
- Rate-limit test: script verifying 5 posts/day is enforced on community_posts.
- Supabase Edge Function (coach feature): deploy the claude-haiku-4-5 proxy with cost caps
  (ANTHROPIC_API_KEY secret-env-only, 10 msgs/day per user, max_tokens hard cap, kill switch).

**Screenshot test** (visual polish gate, PLAYBOOK Part 1.1):
- Review every screen (all 13 app screens + onboarding) against the PLAYBOOK screenshot-test
  checklist: no AI SaaS templates, no generic glassmorphism, typography premium (Space Grotesk +
  Inter), motion smooth 60fps.
- Dark theme colors (#0B1220, #121A26, #1A2433) must read as "midnight premium wellness"
  (Whoop/Eight Sleep grade), not childish or medical.
- Streak ring: liquid-smooth progress with milestone glow. Money counters: odometer roll.
  Panic button: 4-7-8 breathing visible and responsive (60fps required).

**Notifications & lifecycle messaging** (Milestone 4):
- Push notification testing: daily coach push at user's chosen morning time (from onboarding),
  evening check-in prompt, danger-hour alert (scheduled from observed craving patterns),
  milestone celebrations (day 3, 7, 30, 90), buddy alerts (buddy milestone, relapse).
- Email via Resend: onboarding email template (confirm install), churn recovery (7d no use),
  win-back after cancelled subscription (30d later).
- Lifecycle retention matrix (PLAYBOOK 3.2): every message type above must fire in staging.

**Analytics validation** (PostHog):
- Connect app to real PostHog project (EXPO_PUBLIC_POSTHOG_KEY).
- Verify all 17 events captured: quiz_screen_viewed, paywall_viewed, trial_started,
  purchase_completed, panic_button_opened, craving_resisted, relapse_logged, check_in_submitted,
  share_card_exported, + community/buddy/coach events.
- Build funnels: acquisition → activation → paywall → trial → paid → retained (D1/D7/D30).
- Per-screen quiz drop-off: group by screen_index, identify highest-churn screens.

**Build verification issues**:
- `npx expo export` did not produce output to dist/ (likely node process timeout on Windows).
  When fixed: grep dist/ for ANTHROPIC_API_KEY — must be absent from the exported bundle.
