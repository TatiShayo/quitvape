# QuitVape — Quit Vaping Companion App

An evidence-based, privacy-first app to help you quit vaping using proven strategies (cold turkey, taper, CBT, breathing exercises) plus community support and an AI coach.

**Status:** Milestone 3 in development (Expo SDK 57, TypeScript, React Native, Zustand, Supabase).

## Development

### Setup

```bash
npm install
npx expo start
```

### Verification Gate

All PRs and commits must pass:

```bash
npx tsc --noEmit          # TypeScript check
npx eslint .              # ESLint (strict; no warnings)
npx jest                  # 121+ unit tests
npx expo export --platform ios  # Bundle check (no API key leaks)
```

### Key Files

- **App code:** `src/` (providers, domain logic, store)
- **Routes:** `app/` (expo-router file-based routing)
- **Backend:** `src/providers/backend/` (Supabase + mocks)
- **AI Coach:** `supabase/functions/coach/index.ts` (Deno edge function)
- **Tests:** `src/domain/__tests__/`, `src/providers/__tests__/`
- **Config:** `app.json` (Expo), `eas.json` (EAS builds), `tsconfig.json`, `eslint.config.js`

### Conventions

- All third-party services behind typed provider interfaces (`src/providers/*`).
- Missing API keys use mock implementations automatically (dev-friendly).
- Health data (quit/relapse/craving) stays on-device; never logged or synced.
- Community posts are anonymous (randomized handles, no PII).
- RLS-equivalent isolation tests in `mockBackend.isolation.test.ts`.

## App Privacy & Security

### Data Collection

**QuitVape does NOT:**
- Collect, store, or transmit your name, email, phone number, or location.
- Log your quit/relapse/craving history to analytics, error monitoring, or servers.
- Track your behavior across apps or the web.
- Share data with third parties for ads or marketing.

**QuitVape collects (locally only):**
- Quit method (cold turkey vs. taper) — stored in Zustand store on device.
- Streak start date, relapse timestamps — local storage only.
- Mood check-ins, daily puff counts (taper mode) — local storage only.
- Anonymous community posts (no PII, no identifying data).
- AI coach messages (sent to Anthropic API via Supabase proxy; proxy does not log PII).

### Encryption & Transport

- All API calls to Supabase use TLS (HTTPS).
- Device data is stored unencrypted in app-scoped storage (OS controls access).
- Supabase RLS policies enforce user isolation at the database level.
- Coach messages are processed by Anthropic but are not retained or used for training (per Anthropic's API Terms).

### Minimum App Permissions

- **iOS:** Health data (optional; only if user enables lung recovery visual).
- **Android:** No special permissions required.

## Submission Checklist

### Pre-Release

- [ ] All tests passing: `npx jest`
- [ ] Gate clean: `npx tsc && npx eslint . && npx expo export`
- [ ] ANTHROPIC_API_KEY not in bundle: `grep -r ANTHROPIC_API_KEY dist/` returns nothing
- [ ] Supabase schema deployed (migrations applied)
- [ ] RevenueCat products configured (weekly, lifetime)
- [ ] Privacy policy published and linked in app
- [ ] Sentry DSN configured (error monitoring)
- [ ] PostHog project configured (analytics)

### App Store Connect (iOS)

1. Create app in App Store Connect (bundle ID: `com.quitvape.app`)
2. Complete App Privacy form:
   - "Does this app collect personal data?" → **NO** (anonymous, device-local)
   - "Does this app use encryption?" → **YES** (TLS for API calls)
3. Add screenshots, subtitle, keywords (see `docs/store-listing.md`)
4. Set content rating: 17+ (discusses nicotine addiction)
5. Build: `eas build --platform ios --profile production`
6. Submit for review
7. Monitor for rejections (usually about disclaimers on health claims)

### Google Play Console (Android)

1. Create app in Google Play Console (package: `com.quitvape.app`)
2. Complete content rating questionnaire:
   - Alcohol/Tobacco: **YES, FREQUENT** (helping users quit)
   - Violence, Profanity, Sexual: **NO**
3. Add screenshots, description, keywords (see `docs/store-listing.md`)
4. Set category: Health & Fitness
5. Build: `eas build --platform android --profile production`
6. Upload AAB (Android App Bundle)
7. Submit to internal testing track first, then production
8. Monitor for rejections

See `docs/store-listing.md` for full listings (copy, keywords, screenshots, privacy Q&A).

## NEEDS HUMAN

**Keys & Accounts:**
- [ ] Supabase project + migrations (community_posts, buddies, buddy_streaks, coach_messages tables + RLS)
- [ ] RevenueCat Offerings (weekly w/ 3-day trial, lifetime entitlement: "premium")
- [ ] PostHog project + API key
- [ ] Sentry DSN
- [ ] Anthropic API key (Supabase edge function secret only, never in app)

**Store Setup:**
- [ ] App Store Connect developer account ($99/year)
- [ ] Google Play Console developer account ($25 one-time)
- [ ] EAS account + `eas login`, `eas init`
- [ ] Privacy policy draft & legal review
- [ ] App icons (1024×1024) and splash screens
- [ ] Screenshots (iPhone 15 Pro, Pixel 8) with text overlays

**Post-Launch:**
- [ ] Monitor Sentry & PostHog dashboards
- [ ] Address app store review feedback
- [ ] Plan Milestone 4 (push notifications, in-app rating, weekly report PDF)

## Development Milestones

- **Milestone 1:** ✓ Theme, providers, age-gate, panic button, basic home
- **Milestone 2:** ✓ 11-screen onboarding quiz + paywall UX
- **Milestone 3 (in progress):** Home/streak MVP, panic breathing 60fps, relapse flow, check-ins, taper, notifications engine
- **Milestone 4:** Health timeline, achievements, share cards, weekly report, disclaimers
- **Milestone 5:** Supabase schema + RLS, buddy system, AI coach integration
- **Milestone 6:** Screenshot tests, push notifications, in-app rating, referral system
- **Release:** Store submission, EAS builds, legal review

## Documentation

- `PROJECT_STATE.md` — Single source of truth for build continuity
- `BUILD_PROMPT.md` — Feature specification (12 core features)
- `PLAYBOOK.md` — Architecture & security rules
- `analytics.md` — PostHog event catalog and PII scrubbing guarantee
- `docs/store-listing.md` — Store listings, privacy Q&A, submission checklist

## License

This project is private and confidential. Distribution prohibited without explicit permission.

