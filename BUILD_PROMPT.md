# BUILD: QuitVape — Quit Vaping Companion App (Expo React Native)

## Your role
Lead engineer-orchestrator. Build from scratch to a store-submittable mobile app (EAS builds + TestFlight/internal-track ready). All decisions are in this doc; don't stop to ask.

**BINDING COMPANION DOCUMENT**: a universal `PLAYBOOK.md` is supplied alongside this prompt (premium design standards, full security checklist, retention systems, monetization doctrine). Copy it into the repo root and comply with ALL of it — its Definition-of-Done addendum applies to this project.

## Product overview & business model
QuitVape helps people quit vaping with a personalized quit plan, streak tracking, panic-button cravings support, and money/health progress. Modeled on Quittr ($300K/mo, built in 10 days) but for nicotine vaping — bigger, cleaner market. Near-zero marginal cost (only optional AI chat).
- Monetization via RevenueCat: hard paywall after onboarding quiz. $5.99/week (3-day trial) OR $29.99 lifetime (shown as "82% off, one-time"). Weekly is default-selected.
- Distribution assumption: TikTok UGC — the app must produce shareable moments (streak cards, money saved).

## Tech stack (fixed)
- Expo SDK (latest stable) + TypeScript + expo-router; state via zustand + AsyncStorage persistence
- RevenueCat (react-native-purchases) for IAP/subscriptions + paywall gating
- Supabase: anonymous auth (device-based), community feed, craving analytics
- expo-notifications (local scheduled), react-native-reanimated for animations, react-native-svg for progress rings, expo-haptics
- Optional AI coach: Anthropic API `claude-haiku-4-5` via a Supabase Edge Function proxy (never ship API key in app)
- No web app; simple static landing page (single Next.js page on Vercel) for links/privacy/support.

## Data model
Local-first (zustand persisted): quitDate, vapeCostPerWeek, puffsPerDay, dependencyScore, streakStart, relapses[], cravingsLog[{ts, intensity, trigger, resisted}], achievementsUnlocked[], checkIns[{date, mood}].
Supabase: `community_posts` (id, anon_handle, body ≤280 chars, streak_days, created_at, report_count), `craving_events` (anonymized analytics). RLS: insert-only for posts from authed anon users; reads public; auto-hide report_count≥3.

## Features & implementation
1. **Onboarding quiz (12 screens — this IS the product's conversion engine)**: age range → how long vaping → device type → puffs/day slider → first puff timing (on waking?) → failed quit attempts → why quit (multi-select: money/health/freedom/relationship) → weekly spend slider → "Your dependency score: 7.8/10" (computed: weighted sum, animated gauge, brutal-but-kind copy) → projected savings chart (1yr/5yr, animated counting) → personalized quit plan preview → PAYWALL (RevenueCat paywall: weekly-with-trial default, lifetime alt, testimonials, "cancel anytime", restore purchases). No app access without purchase/trial.
2. **Home / streak screen**: huge streak counter (days:hours:mins live), circular progress ring to next milestone, regrowth visual (a pair of lungs that visually clear/heal as streak grows — SVG with staged states at day 1/3/7/14/30/90), money saved counter (live-ticking), today's check-in prompt.
3. **Panic button (always visible, thumb-reachable)**: full-screen takeover → 60-second guided breathing (animated circle, haptics on inhale/exhale) → then shows user's own "why I quit" answers + money saved → "Craving passed 💪 / I slipped" buttons → logs craving with trigger picker (stress/social/boredom/drinking).
4. **Health timeline**: science-based milestones (20 min heart rate, 24h nicotine drop, 48h taste/smell, 2w circulation, 1m lung function, 3m cravings fade, 1y risk halved) — each card with unlocked/locked state tied to streak, plain-language explanation. Store copy in a local JSON; cite sources in an info modal.
5. **Relapse flow (compassion, not shame)**: "Slips are part of quitting. Your 12 days still count." → log what triggered it → streak resets but "total days vape-free" lifetime stat keeps counting → generates adjusted plan tip.
6. **Daily check-in + notifications**: morning motivation (local notification, rotating copy), evening check-in (mood 5-emoji scale), streak-milestone celebration notifications, danger-hour notification (computed from their craving log patterns — e.g., most cravings logged 9-11pm → schedule support ping 8:45pm).
7. **Community feed**: anonymous handles (auto-generated "QuittingEagle42"), post wins/struggles, tap-to-send preset encouragements (no free-text replies v1 — kills moderation load), report button.
8. **Achievements & share cards**: badges (24h, 72h, 1w, 2w, 1m, 100 puffs resisted, $100 saved…), each unlock generates a designed share card (react-native-view-shot) sized for IG story/TikTok — dark bg, big number, app name small. This is the growth loop.
9. **AI coach tab (post-trial only)**: chat with "Coach" (Haiku via edge function, system prompt: supportive quit-coach, CBT techniques, never medical advice, ≤120 word replies), 10 msgs/day cap.
10. **Settings**: edit spend/quit date, notification prefs, restore purchases, privacy policy, delete data.

11. **Quit-method choice (doubles the addressable market)**: onboarding asks Cold Turkey vs Gradual Taper. Taper mode: personalized reduction schedule (default −15%/week from baseline puffs/day), daily allowance ring with a big puff-log button on home, weekly step-down celebrations, and an automatic "ready to quit fully?" prompt when allowance drops below 20% of baseline. Streak logic switches to "days on plan" until full quit date.
12. **Accountability buddy (v1-lite, viral loop)**: generate an invite deep link → paired users see each other's streak on home and get notified on buddy milestones/relapses, with tap-to-send preset encouragements. Supabase `buddies` table (user_a, user_b, created_at). NO chat — presets only.
13. **Weekly progress report**: Sunday local notification → report screen (cravings resisted, money saved, mood trend, streak chart via react-native-svg) rendered as a shareable card. Second growth surface after achievements.
14. **Age gate + disclaimers (store compliance)**: 18+ confirmation on first launch; "not medical advice" disclaimer in onboarding and settings; quit-support hotline links (US 1-800-QUIT-NOW default, region-aware list in JSON); set store age rating accordingly (17+ Apple / adult Google).
15. **Smart review prompt**: expo-store-review triggered exactly once, at the 7-day streak celebration (peak happiness). NEVER after a relapse or during a craving flow.

## Premium UI & motion direction (follow PLAYBOOK Part 1 + this art direction)
**Concept: "midnight premium wellness"** — a Whoop/Eight Sleep-grade dark interface, never a childish gamified quit app or a medical pamphlet.
- Palette: layered dark surfaces #0B1220 → #121A26 → #1A2433, teal accent #2DD4BF (glow reserved for the streak ring only), warm amber for money numbers. Type: Space Grotesk (display) + Inter (body), tabular numerals — the streak counter is typographic art, huge and precise.
- **Signature interaction — the panic-button breathing sequence**: full-screen takeover, orb expanding/contracting on a 4-7-8 rhythm with haptics synced to breath phases, background gradient temperature shifting with each phase, closing with their own "why I quit" words fading in one by one. Someone mid-craving must feel the app breathe with them. 60fps non-negotiable.
- Streak ring: liquid-smooth progress with a soft teal glow that intensifies near milestones; money counter rolls like an odometer whenever the screen appears.
- Lungs visual: elegant line-art SVG that clears/brightens through staged states (day 1/3/7/14/30/90) with crossfade morphs — anatomical-beautiful, not cartoonish.
- Achievement unlocks: card flips with a metallic sheen sweep (credit-card premium, not confetti); share cards look like numbered metal membership cards — dark, minimal, one huge stat.
- Haptics on meaningful moments only (milestone, craving resisted, unlock). Reduce-motion respected.

## Security (project-specific threat model — PLAYBOOK Part 2 applies in full)
- Health-adjacent data is the crown jewel: keep it local-first; anything synced (craving analytics) is anonymized and never joinable to identity; no quit/relapse data in PostHog user properties, logs, or Sentry.
- Anonymous auth: device-bound (secure storage for the Supabase session); all RLS policies key on auth.uid — write the deny-test proving one anon user can't read another's rows.
- Community: server-side profanity filter on posts, preset-only replies, report auto-hide at 3, block-user, length caps, rate limit 5 posts/day — assume trolls from day one.
- AI coach edge function: auth + entitlement checked server-side, 10 msgs/day + length caps enforced server-side, user text delimited against prompt injection, system prompt server-side, kill-switch env flag.
- In-app "delete all my data" wipes local store + Supabase rows (Apple requirement and GDPR).

## Retention engine (PLAYBOOK Part 3 applies — retention IS this product)
- Activation event: surviving the first 24 hours (first "day 1 complete" celebration). Everything in onboarding points at reaching tomorrow.
- Week-1 choreography (highest-risk window): daily coach push at their chosen morning time, evening check-in, danger-hour support ping (from their craving-log patterns), day-3 and day-7 milestone celebrations with share cards.
- Relapse win-back: a relapse is the #1 churn moment — the compassion flow (already specced) plus a next-morning push: "Your 12 days still count. Most people need 3 attempts. Start attempt #2 stronger." Never guilt.
- Buddy system doubles retention leverage: buddy milestone/relapse notifications create social obligation to return.
- Weekly report (Sunday) is the habit anchor; monthly "your quit story" recap at 30/60/90 days as a shareable timeline.

## Revenue maximization (PLAYBOOK Part 4 applies)
- Pricing via RevenueCat Offerings (remote-config): $5.99/wk with 3-day trial (default) vs $29.99 lifetime anchor ("82% off"). First experiment once traffic exists: lifetime at $39.99 vs $29.99.
- Paywall shows THEIR numbers: dependency score, projected 1-year savings ("This app costs less than 2 weeks of vaping").
- Win-back offering: churned subscribers get a one-time discounted lifetime offer via RevenueCat targeting (30 days post-churn).
- Hybrid top-up: none v1 — keep it clean; revisit if AI coach demand exceeds caps.
- Review prompt at 7-day streak (specced) — ratings are the ASO flywheel; respond to every ≤4★ review (README ritual).

## Cross-cutting requirements (non-negotiable)
- **Analytics**: PostHog React Native SDK. Instrument every onboarding quiz screen (drop-off per screen), paywall view/variant, trial start, purchase, panic-button uses, relapses, share-card exports. This category lives or dies on quiz→paywall conversion — you must be able to see it.
- **Error monitoring**: sentry-expo, wired in scaffold.
- **RevenueCat hygiene**: entitlement re-check on app foreground; restore purchases tested in sandbox; paywall pricing/copy driven by RevenueCat Offerings (remote-configurable) so price tests need no app update; structure paywall for RevenueCat Experiments.
- **Privacy & store compliance**: health-adjacent data stays local-first; privacy policy accessible in-app (store requirement); in-app "delete all my data" (Apple requirement when any account exists — including anonymous); App Privacy questionnaire answers documented in README.
- **Build continuity**: maintain `PROJECT_STATE.md` at repo root — update after every milestone: done / next / NEEDS HUMAN (RevenueCat products, store listings, certs). Assume the build may resume in a fresh session with zero memory.
- **Never stall on missing keys**: RevenueCat/Supabase/Anthropic behind typed provider interfaces with mocks (mock paywall auto-grants entitlement in dev); missing key → mock + NEEDS HUMAN note, keep building.
- **Placeholder honesty**: paywall testimonials clearly marked placeholder until real ones exist.

## Agent orchestration
1. **Scaffold agent**: Expo app, expo-router structure, zustand stores, theme system, PostHog + Sentry wiring, PROJECT_STATE.md, CI (tsc + eslint + jest).
2. **Onboarding+paywall agent**: full 12-screen quiz + RevenueCat integration + gating. Money path first. Use RevenueCat sandbox.
3. **Core loop agent**: home/streak, panic button, relapse flow, check-ins, taper mode + puff logging.
4. **Content agents (parallel)**: health timeline (+write all milestone copy), achievements + share cards, weekly report, notifications engine, age gate/disclaimers.
5. **Backend agent**: Supabase schema, anon auth, community feed, buddy system, AI coach edge function.
6. **Polish agent**: motion pass (breathing sequence signature interaction tuned to 60fps first), haptics map, empty/error states, PLAYBOOK screenshot test on every screen — redo failures.
7. **Security agent**: PLAYBOOK Part 2 + threat model above as a checklist; RLS deny-test, edge-function rate-limit/entitlement tests, data-deletion verification.
8. **QA agent**: jest unit tests for streak/money/dependency-score math (timezone edge cases!), manual test script doc, run on iOS simulator + Android emulator via Expo.
9. **Release agent**: app icons/splash (generate), privacy policy + support page, store listing copy (title/subtitle/keywords/screenshots plan), eas.json build profiles, EAS build instructions in README.
Env: EXPO_PUBLIC_SUPABASE_URL/ANON_KEY, RevenueCat API keys (iOS/Android), ANTHROPIC_API_KEY (edge function secret only).

## Definition of done
- Runs clean on iOS simulator + Android emulator; EAS build config ready; RevenueCat sandbox purchase + restore working
- Full flow: quiz → paywall → trial → streak home → panic button → share card export
- Streak math unit-tested incl. timezone/DST; notifications fire correctly
- README: store submission checklist, RevenueCat + App Store Connect/Play Console setup steps

## Out of scope v1
Apple Watch, home-screen widgets, free-text community replies, cigarettes/other substances (vaping only), web version.

