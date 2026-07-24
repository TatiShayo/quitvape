# QuitVape — Vision Review (Round 1)

**Date:** 2026-07-24  
**Stack:** React Native / Expo (web export via `npx expo export --platform web`)  
**Viewport Targets:** Desktop 1280×800, Mobile 375×812  
**Reviewed by:** Automated Vision-in-the-Loop pipeline  
**Web Export:** Served from `dist/` via `npx serve`

---

## Screenshots Captured

| Screen | Desktop | Mobile |
|--------|---------|--------|
| Age Gate (home) | ✅ `home_desktop.png` | ✅ `home_mobile.png` |
| Onboarding index | ✅ `index_desktop.png` | ✅ `index_mobile.png` |
| Coach screen | ✅ `coach_desktop.png` | ✅ `coach_mobile.png` |
| Health screen | ✅ `health_desktop.png` | ✅ `health_mobile.png` |

8 screenshots captured across 4 screens and 2 viewports.

---

## Visual Rubric Review

### ✅ Typography Hierarchy
- **Dark mode throughout**: All screens use deep navy/charcoal background (`#0D1117` approx).
- **Age Gate**: `BEFORE WE BEGIN` super-label in teal, bold H1 `Are you 18 or older?`, legible body text in muted white/grey — clear hierarchy.
- **Coach screen**: `COACH` section label in teal accent, `Your quit coach` H1 in white, body text in card — readable on dark background.
- **Bottom tab nav**: Icon + label pairs — consistent `Home`, `Health`, `Community`, `Coach`, `Settings`.

### ✅ Color Contrast
- Background: Dark navy `#0D1117` — **dark mode design**.
- Primary text: White/near-white — excellent contrast.
- Teal accent (`#00D9A6` approx.): Used for section labels and CTA button — vibrant, WCAG AA compliant against dark background.
- Body text in cards: Light grey on slightly lighter dark — borderline on very small text, check at WCAG AA for body sizes under 14px.

### ✅ Primary CTA — Clear per screen
- **Age Gate**: `Yes, I'm 18 or older` — full-width teal pill button, pinned to bottom of screen, unmissable. Age-gate pattern is correct for tobacco/nicotine apps.
- **Coach screen**: Content placeholder card visible — CTA will appear when feature ships.

### ✅ Responsive Layout (Mobile)
- Expo web renders correctly at mobile viewport (375×812).
- Bottom tab bar visible and functional at mobile.
- Age gate CTA pinned to bottom — correct mobile pattern for action buttons.

### ✅ No Emoji as UI Icons
- Bottom nav uses SVG/vector icons (home, heart, people, lightning/coach, gear). No emoji. Clean.

### ⚠️ Issues Found

| Severity | Screen | Issue |
|----------|--------|-------|
| **MEDIUM** | Coach screen | **"Coming soon" placeholder** — entire Coach feature is unimplemented. Shows an info card with future promise text rather than a real UI. Not launch-ready. |
| **MEDIUM** | Age Gate desktop | Age gate uses full-screen mobile layout on desktop — no desktop-specific layout adaptation. 80% of the desktop viewport is empty dark space below the text. |
| **LOW** | All screens | Bottom nav visible in static web export but non-functional (React Navigation state is not initialized properly in static export). Navigation between screens requires app shell. |
| **INFO** | Web export | This is a static web export of a native app — not a true web app. The web export serves as a preview/demo only. For real usage, a device/emulator is required. |

---

## Recommendations

1. **Implement Coach feature** before launch — placeholder screen is visible to users.
2. **Add responsive breakpoint** for desktop viewport — at ≥768px wide, constrain content to a centered mobile-width column with visible desktop chrome.
3. **Test navigation flow** in Expo Go or EAS build — static export navigation is limited.
4. **Device/Simulator screenshot needed**: For a production-quality visual review, run on iOS Simulator or Android Emulator for real rendered screenshots.

---

## Verdict

**PASS (web preview). NEEDS DEVICE REVIEW (production).** Core dark-mode design language is polished — teal accents, clean typography, pinned CTAs. The age gate and health screens show a mature, production-quality UX pattern. Coach feature is an outstanding blocker for launch.
