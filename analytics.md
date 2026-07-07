# Analytics — QuitVape

PostHog React Native SDK. Event naming: `object_action` (PLAYBOOK Part 5). Every event
is documented here; no orphan events. Health-adjacent data (relapse/craving/mood/trigger
details, quit dates, community post bodies/handles) is NEVER sent as an event property —
enforced by a runtime scrubber in `src/providers/analytics/index.ts` (`BLOCKED_KEY` regex
drops any property key matching `relapse|craving|trigger|quit_?date|mood|handle|note|body|message`
even if a caller passes it by mistake).

Provider: `src/providers/analytics/index.ts`. No-op mock when `EXPO_PUBLIC_POSTHOG_KEY`
is unset (see NEEDS HUMAN in PROJECT_STATE.md).

## Onboarding funnel (acquisition -> activation -> paywall -> trial -> paid)

| Event | Fired from | Properties | Purpose |
|---|---|---|---|
| `quiz_screen_viewed` | `app/(onboarding)/quiz/[step].tsx` | `screen_index` (0-10) | Per-screen drop-off funnel across the 11-screen quiz. |
| `quiz_completed` | `app/(onboarding)/quiz/[step].tsx` | — | Marks quiz completion, immediately before the paywall. |
| `paywall_viewed` | `app/paywall.tsx` | — | Paywall funnel entry. |
| `trial_started` | `app/paywall.tsx` | — | Fired when a purchase result's entitlement is `inTrial`. |
| `purchase_completed` | `app/paywall.tsx` | `plan` (`weekly`\|`lifetime`) | Any successful purchase (trial or lifetime). |
| `purchase_restored` | `app/paywall.tsx` | — | Restore-purchases flow recovers an active entitlement. |

## Core loop

| Event | Fired from | Properties | Purpose |
|---|---|---|---|
| `panic_button_opened` | `app/panic.tsx` | — | Signature-interaction usage (craving support entered). |
| `craving_resisted` | `app/panic.tsx` | — | User marks "Craving passed" after the breathing sequence. |
| `relapse_logged` | `app/relapse.tsx` | — | User confirms a logged slip on the compassion-flow screen. No trigger/intensity details sent (health-adjacent). |
| `check_in_submitted` | `app/(app)/home.tsx` | — | Daily mood check-in submitted. Mood value itself is never sent. |
| `share_card_exported` | (wired in achievements milestone) | `card_type` | Achievement/weekly-report share card exported via `react-native-view-shot`. |

## Funnels to build in PostHog (day 1, PLAYBOOK Part 5)
1. Acquisition -> `quiz_screen_viewed` (screen 0) -> `quiz_completed` -> `paywall_viewed` -> `trial_started`/`purchase_completed` -> retained (D1/D7/D30 on app opens).
2. Per-screen quiz drop-off: `quiz_screen_viewed` grouped by `screen_index`, breakdown of never reaching `screen_index=10`.
3. Paywall conversion: `paywall_viewed` -> `purchase_completed` rate; `plan` property breaks out weekly vs lifetime mix.

## Conventions
- All property values are primitives (string/number/boolean) or `undefined` — never nested objects, never free text.
- Every new event must be added to this file in the same change that adds the `capture()` call.
- `identify()` is called once at bootstrap with the opaque Supabase anonymous user id only (no PII) — see `src/app-core/bootstrap.ts`.
