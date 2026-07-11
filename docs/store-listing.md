# QuitVape — App Store Listings

App Store Connect (iOS) and Google Play Console (Android) listings.

## App Store Connect (iOS) — com.quitvape.app

### App Privacy

**Privacy Policy URL:** `https://quitvape.app/privacy` (NEEDS HUMAN: publish privacy policy)

**App Privacy (mandatory questions):**
- Does this app collect, use, or share any personal data?
  - **NO.** QuitVape uses anonymous device-bound authentication. No personally identifiable information (name, email, phone, location, etc.) is ever collected or transmitted.
  - Health data (quit/relapse/craving) stays on-device in local storage only; never synced to servers or logged to analytics.
  - Community posts are published under randomized anonymous handles, not tied to identity.
  - Exception: AI coach messages are sent to Anthropic's API via a server-side proxy; the proxy does not log PII.
- Does this app use encryption?
  - **YES.** All Supabase API calls use TLS encryption. No user data is encrypted on-device (health data is device-local, never persisted outside the app).

### Listing Metadata

**Name:** QuitVape — Quit Vaping Companion

**Subtitle:** Your personal quit-vaping coach & community. Private. Evidence-based.

**Description:**

QuitVape is a judgment-free companion for quitting vaping. Whether you're quitting cold turkey or tapering gradually, QuitVape tracks your streak, celebrates milestones, and gives you tools to handle cravings when they hit.

**Features:**
- **Streak Tracking & Milestones** – Watch your days add up, earn achievement badges, and see exactly how much money you've saved.
- **Panic Button & Breathing** – Cravings strike fast. Hit the panic button for a 4-7-8 breathing exercise with haptic feedback and on-screen guidance.
- **AI Coach** – Chat with a CBT-trained AI coach powered by Anthropic's Claude. Private, judgment-free, evidence-based suggestions.
- **Taper or Cold Turkey** – Choose your quit method at the start. Taper mode tracks your daily puff allowance; cold turkey mode celebrates full abstinence.
- **Community Feed** – Share your wins (anonymously) and read others' stories. Send preset encouragements (no free-text moderation burden).
- **Buddy Accountability** – Pair with a friend or partner for shared streak goals and mutual support.
- **Health Timeline** – See how your lungs are recovering week by week (lung visual, taste/smell, energy).
- **Weekly Report** – PDF snapshot of your wins, spending saved, and progress toward milestones.
- **Dark Premium Design** – Beautiful "midnight premium wellness" theme built for focus and calm.

**Why QuitVape?**
- **Private by Design** – Your quit/relapse history never leaves your device or enters our logs. No ads, no selling your data.
- **Evidence-Based** – Built on proven quit-vaping strategies: cold turkey, taper, harm reduction, and CBT.
- **Accessibility** – Free with premium features: AI coach, taper tracking, achievements, sharing. One-time purchase or weekly trial.
- **Transparent** – Open-source. No hidden subscription traps.

**Age Rating:** 17+ (the app discusses vaping/nicotine addiction; not for minors without parental supervision)

**Category:** Health & Fitness

**Keywords:** quit vaping, vape quit, quit nicotine, quit e-cigs, breathing exercises, quit smoking, wellness, health tracker, meditation, anxiety relief

### Screenshots (5x for iPhone)

**Screenshot 1: Streak Ring & Home Screen**
- Headline: "Your quit journey, day by day"
- Body: Shows the main home screen with a large circular streak counter (e.g., "12 DAYS"), animated background lung visual, panic button, and daily mood check-in.
- Subtext: "Watch your days add up. Celebrate milestones. See your savings grow."

**Screenshot 2: Panic Button & Breathing**
- Headline: "Cravings strike. You're ready."
- Body: Shows the breathing exercise screen with a large animated orb (3x scale, smooth pulse), numeric timer (4-7-8 rhythm), and haptic feedback indicator.
- Subtext: "Hit panic. Breathe. Craving passes. No judgment."

**Screenshot 3: AI Coach Chat**
- Headline: "Your personal quit coach"
- Body: Shows a chat UI with the user's message ("I want a cigarette") and the coach's response ("You've made it 12 days. That's already a huge win. Let's talk through what's triggering this right now...")
- Subtext: "CBT-trained, private, evidence-based."

**Screenshot 4: Community Feed**
- Headline: "You're not alone"
- Body: Shows the community feed with 2–3 posts from anonymous users (e.g., "QuittingEagle42: Day 9. The 9pm cravings are the worst but the breathing thing actually works."), with preset encouragement buttons (heart, fist-bump, fire).
- Subtext: "Share wins. Read stories. Send encouragement (anonymously)."

**Screenshot 5: Weekly Report & Achievements**
- Headline: "Your weekly wins"
- Body: Shows a weekly report card with stats: "7 days smoked, $87 saved, 56 puffs avoided, 3 breathing exercises". Also shows achievement badges (7-day, 14-day, 30-day streaks).
- Subtext: "Download. Share. Celebrate."

### Content Ratings

- Alcohol, Tobacco, or Drug Use or References: **FREQUENT/INTENSE** (the app's purpose is to help users quit vaping; discussing nicotine use is central)
- Medical/Treatment Information: **INFREQUENT/MILD** (lung recovery timeline, breathing exercises for anxiety; not medical advice)
- Mental Health Concerns: **INFREQUENT/MILD** (discussion of cravings, anxiety, relapse as part of addiction recovery)

---

## Google Play Console (Android) — com.quitvape.app

### Store Listing

**App Name:** QuitVape — Quit Vaping Companion

**Short Description** (80 chars):
Your personal quit-vaping coach & community. Private. Evidence-based.

**Full Description:**
(Same as iOS "Description" above)

**Tagline:** Quit vaping. Stay strong. Save money.

### Content Rating Questionnaire

**Alcohol & Tobacco:**
- Does your app contain references to or depictions of vaping/e-cigarettes, cigarettes, pipes, or cigars? **YES** – The app's primary purpose is to help users quit vaping; it includes discussions of nicotine use and addiction recovery.
- Frequency: **Often**
- Depictions: References only (educational, supportive)

**Violence:**
- Any depictions of violence? **NO**

**Profanity:**
- Any profanity? **NO** (profanity filter in community posts catches user input)

**Sexual Content:**
- Any sexual content? **NO**

**Medical:**
- Does your app provide medical treatment, diagnosis, or medication information? **NO** (provides supportive recovery strategies and breathing exercises; includes disclaimers that it is not medical advice)

---

## Release Checklist

### Before Store Submission

- [ ] Privacy Policy published and linked in store listings
- [ ] App icons (1024×1024, iOS + Android variants) finalized
- [ ] Splash screen images prepared
- [ ] Screenshots captured (iPhone 15/15 Pro, Pixel 8) and text overlays added
- [ ] Localization (if any): app name, subtitle, keywords translated
- [ ] All 121 unit tests passing (`npx jest`)
- [ ] Full gate passing: `npx tsc --noEmit && npx eslint . --max-warnings=0 && npx jest`
- [ ] `npx expo export` succeeds for iOS and Android
- [ ] ANTHROPIC_API_KEY NOT present in bundle (verified by grep)
- [ ] Supabase migrations applied: community_posts, buddies, buddy_streaks, coach_messages, RLS policies
- [ ] RevenueCat Offerings configured: weekly (3-day trial), lifetime
- [ ] App Store Connect app record created with bundle id `com.quitvape.app`
- [ ] Google Play Console app record created with package `com.quitvape.app`

### App Store Connect (iOS)

- [ ] App Privacy form completed (see App Privacy section above)
- [ ] App category: Health & Fitness
- [ ] Age rating: 17+
- [ ] Content ratings: Alcohol/Tobacco (FREQUENT), Mental Health (MILD)
- [ ] Version number in Xcode: 1.0.0
- [ ] Build number: 1
- [ ] Minimum iOS: 13.0 (set by Expo SDK 57 baseline)
- [ ] Run EAS build: `eas build --platform ios --profile production`
- [ ] Download .ipa, upload to App Store Connect via Xcode Organizer or web interface
- [ ] Submit for review

### Google Play Console (Android)

- [ ] Content rating form completed (see Content Rating section above)
- [ ] Target API level: 35 (Expo SDK 57 baseline)
- [ ] Minimum API level: 24 (Expo SDK 57 baseline)
- [ ] App category: Health & Fitness
- [ ] Content rating: Alcohol & Tobacco (FREQUENT)
- [ ] Run EAS build: `eas build --platform android --profile production`
- [ ] Download .aab (Android App Bundle)
- [ ] Upload to Google Play Console → Internal Testing → Production Track
- [ ] Submit for review

### Post-Launch

- [ ] Monitor Sentry for errors
- [ ] Monitor PostHog for funnel analytics (age-gate → quiz → paywall → home)
- [ ] Monitor RevenueCat for purchase events
- [ ] Set up in-app rating prompt (flutter_rating_bar or similar in Milestone 6)
- [ ] Prepare update for Milestone 6 (push notifications, in-app prompts, referral)

---

## NEEDS HUMAN

1. **Privacy Policy & Terms**: Draft, legal review, and publish at quitvape.app/privacy and quitvape.app/terms.
2. **App Store Connect Account**: Create developer account ($99/year), enroll in Apple Developer Program, register bundle ID.
3. **Google Play Console Account**: Create developer account ($25 one-time), register package name.
4. **EAS Account & Project**: `eas login`, `eas init`, configure project ID in eas.json.
5. **Screenshots**: Take high-quality screenshots on target devices (iPhone 15, Pixel 8); add text overlays.
6. **Content Rating Forms**: Complete App Store Connect App Privacy and Google Play Content Rating questionnaires.
7. **Review Submissions**: Submit both apps for review; address any rejection feedback (usually about disclaimers on health claims).
8. **Monitoring**: Set up alerts in Sentry and PostHog for launch week.
