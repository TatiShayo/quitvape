# PROJECT_STATE — QuitVape — Quit Vaping Companion App (Expo React Native)

> Single source of truth for build continuity. Update after every milestone.
> A fresh session with zero memory must be able to resume from this file alone.

## Status: MILESTONE 1 (SCAFFOLD) IN PROGRESS — resumed 2026-07-07

Reality check on resume: the repo contained ONLY the bare Expo scaffold (app.json,
assets, package.json + lockfile, tsconfig, README, PLAYBOOK, BUILD_PROMPT) plus an
empty "checkpoint" commit. There were ZERO source files (no `app/`, no `src/`). The
previous PROJECT_STATE claiming "Milestone 1 next" was accurate about intent but the
work had not landed. This session starts the scaffold for real.

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
  user's quit/relapse history goes to PostHog/Sentry/logs. Synced craving analytics are
  anonymized and non-joinable to identity.
- Theme: "midnight premium wellness" tokens in `src/theme`. Space Grotesk (display) +
  Inter (body), tabular numerals for all stats/timers/money.

## Done (this session)
- Rewrote PROJECT_STATE.md to reflect true on-disk state.

## Next
- Milestone 1 remainder: theme system, env/config, provider interfaces + mocks
  (RevenueCat, Supabase, analytics/Sentry, notifications), zustand stores, expo-router
  shell (root layout + providers + tab stub), tooling (eslint, jest, ts strict).
- Milestone 2: 12-screen onboarding quiz + paywall + gating.
- Then core loop, content, backend, polish, security, QA, release (see BUILD_PROMPT
  "Agent orchestration").

## Verification gate (no simulators on this Windows machine)
`npx tsc --noEmit` + eslint + jest must pass, and `npx expo export` must succeed.
Simulator / EAS / store steps are documented as NEEDS HUMAN, not executed here.

## NEEDS HUMAN
Keys/config (build proceeds on mocks until provided; add real values to `.env`):
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase project.
- `EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` — RevenueCat.
- `EXPO_PUBLIC_POSTHOG_KEY` (+ host) — PostHog analytics.
- `EXPO_PUBLIC_SENTRY_DSN` — Sentry error monitoring.
- `ANTHROPIC_API_KEY` — Supabase Edge Function secret ONLY (never in app bundle).
Store/infra actions requiring a human (not done here):
- RevenueCat Offerings/products/entitlement ("premium") configuration.
- App Store Connect / Play Console app records, age rating (17+ / adult), listings.
- EAS project id + `eas build` runs; simulator/emulator verification.
- Supabase deploy (schema migration + edge function deploy + RLS).
