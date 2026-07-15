# quitvape — DeepSeek Audit

**Date:** 2026-07-13
**Path:** `C:\Users\TATI\Desktop\DEV\quitvape\`
**Stack:** TypeScript / Expo (React Native) + Supabase
**Tier:** 3 — Medium
**Dependencies:** None installed

---

## 🔴 Security Vulnerabilities

| Severity | File | Line(s) | Vulnerability | Exact Fix |
|----------|------|---------|---------------|-----------|
| ✅ | `src/providers/backend/supabaseClient.ts` | — | Device-bound anonymous sessions via expo-secure-store. Good. | — |
| ✅ | `supabase/functions/coach/index.ts` | — | JWT verified server-side via `supabase.auth.getUser(jwt)`. Never decode-and-trust. Good. | — |
| ✅ | `supabase/functions/coach/index.ts` | — | ANTHROPIC_API_KEY is server-only (never in app bundle). Good. | — |
| ✅ | `src/domain/profanity.ts` | — | Profanity filter + length cap on community posts. Good. | — |
| ✅ | `src/providers/backend/__tests__/mockBackend.isolation.test.ts` | — | Session isolation tests (RLS-equivalent). Good. | — |

---

## 🟡 UI/UX Improvements

| Severity | File | Line(s) | Issue | Exact Fix |
|----------|------|---------|-------|-----------|
| 🟡 MEDIUM | `app/(app)/community.tsx` | 51-52 | Community post validation uses `Alert.alert()` — disruptive modal blocking the screen. | Replace with inline validation: show error text below the input field with red border. Reserve `Alert.alert()` for critical confirmations only. |
| 🟡 MEDIUM | `src/ui/Button.tsx`, `src/ui/Card.tsx` | — | Missing `accessibilityLabel` on most UI components — limited screen reader support. | Add `accessibilityLabel` prop to Button, Card, and other interactive components. Map to React Native `accessibilityLabel` attribute. |
| ✅ | `src/theme/colors.ts` | — | Full design token system with type-safe color tokens. Good. | — |
| ✅ | `src/theme/typography.ts` | — | Type-safe typography tokens. Good. | — |
| ✅ | `src/theme/index.ts` | — | Centralized theme export. Good. | — |
| ✅ | Architecture | — | Domain logic separated from UI (domain/, providers/, ui/). Good. | — |

---

## 🔧 Session: 2026-07-14 — Multi-Agent Deep Audit Sweep (Round 1)

**Status:** Not audited in this round. Expo SDK 57 mobile app with RevenueCat + Sentry + PostHog. Sweep Round 2 will cover Tier 4.

| Category | Package | Issue | Fix |
|----------|---------|-------|-----|
| 🔴 CRITICAL | `@sentry/react-native ~7.11.0` | **Version ~7.11.0 does not exist.** Sentry React Native latest is ~6.x. This is either a typo (should be ~6.11.0) or a completely bogus version that will fail to install. | Verify with `npm view @sentry/react-native versions`. Likely should be `~6.11.0` or latest `~6.x`. Update to correct version. |
| 🟡 MEDIUM | `expo ~57` (implied) | Expo SDK 57 is cutting edge — ensure all expo-* packages are compatible. | — |
| 🟡 MEDIUM | `react-native-reanimated` | Present in deps — heavy but justified for animations. | Keep. |
| 🟡 MEDIUM | `@sentry/react-native`, `posthog-react-native` | Analytics + error tracking in mobile app — justified. | — |

---

## 📋 Priority Fix Queue

1. **[CRITICAL — Bogus Version]** Fix `@sentry/react-native ~7.11.0` — verify correct version and update. Run `npm ls @sentry/react-native` to see what's actually resolvable.
2. **[MEDIUM — Alert.alert UX]** `app/(app)/community.tsx:51-52` — Replace `Alert.alert()` validation with inline field errors.
3. **[MEDIUM — Accessibility]** `src/ui/Button.tsx`, `src/ui/Card.tsx` — Add `accessibilityLabel` prop support.
4. **[LOW]** Add `.nvmrc` (Node 22 for Expo 57).
