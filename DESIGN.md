# QuitVape — Design System: "First Light"

This document explains *why* the interface looks the way it does. Every choice below is
a behavioural decision first and an aesthetic one second. If you change something here,
change it knowing what it was doing.

---

## 1. The core idea

**Progress is the light level of the sky you are standing in.**

Every screen is painted on a gradient that runs from deep night to first light. Its
position is a direct function of streak length. Day 1 opens in near-darkness; day 365
opens with a warm horizon.

### Why not a progress ring

Two reasons.

1. **Perceptual.** Cleveland & McGill's ranking of graphical encodings puts *position
   along a common scale* at the top and *angle/area* near the bottom. A progress ring is
   angle and area — the channel humans read least accurately. Ambient lightness is
   processed pre-attentively, before conscious attention is allocated.

2. **Situational.** The moment this app most needs to work is mid-craving, when
   sympathetic arousal is high and executive function is measurably suppressed. That is
   the worst possible time to ask someone to parse a chart. The sky tells them where they
   stand without requiring them to read anything.

The one place a bar *is* used — the milestone rule under the hero number — is straight,
because that is position on a common scale, the encoding that actually works.

### Why it never starts at black

Endowed progress effect (Nunes & Drèze): participants given a head start on a loyalty
card completed it at roughly double the rate of those started at zero, for identical
required effort. `skyProgress()` uses a logarithmic curve so day 1 already produces
visible movement:

| Day | Sky position |
|---|---|
| 1 | 0.12 |
| 7 | 0.35 |
| 30 | 0.58 |
| 90 | 0.76 |
| 365 | 1.00 |

Early days move the sky the most — which is exactly when relapse risk peaks and visible
feedback is worth the most.

### Why the zenith stays dark

Body copy lives on the upper two thirds. Holding the top of the gradient dark across the
entire ramp keeps every text token above WCAG AA contrast at both ends of the journey.
The warmth arrives at the horizon, where no text sits.

Implementation: `src/theme/sky.ts`, `src/ui/Sky.tsx`.

---

## 2. Colour

### The palette

| Token | Value | Reserved for |
|---|---|---|
| `accent` | `#9BA4F0` periwinkle | Interactive affordances, neutral emphasis |
| `money` / `reward` | `#F0B267` dawn amber | Money saved and crossed milestones **only** |
| `care` | `#E8A0A8` warm rose | Slips, relapses, hard moments |
| `danger` | `#E8767E` | Destructive confirmations only — never the user's behaviour |
| `success` | `#8FD4B0` | Sparingly; never as "you complied" |

### There is no green-good / red-bad axis

The conventional health palette moralises: green rewards compliance, red punishes
failure. That framing is actively harmful here.

Shame following a lapse is the strongest behavioural predictor of abandoning a cessation
attempt. The **abstinence violation effect** (Marlatt & Gordon) describes the mechanism:
a single slip gets reframed by the user as proof the whole attempt has failed, and *that
reframe* — not the nicotine — is what converts a lapse into a full relapse. An interface
that renders the slip in alarm red is confirming the reframe.

So red is banished from every path the user can take. It survives only on "delete my
account".

### Low-arousal ground

Blue-violet at low saturation occupies the low-arousal, moderately-pleasant quadrant of
the affective colour space (Valdez & Mehrabian, 1994). Long-wavelength, high-saturation
colour raises arousal.

A craving *is* an arousal spike. The palette is deliberately doing the opposite of what
the user's body is doing.

### Warmth is scarce and earned

Amber appears in exactly two places: money saved, and milestones crossed. This is not
restraint for its own sake — a reward signal is only legible if it is rare. If every
card glows, nothing reads as a win.

### The mood scale is monochrome

The five-point check-in uses one neutral colour across all faces. A red-to-green mood
scale tells the user which answers are the good ones and biases what they report — which
makes the resulting trend data worthless for the coach that consumes it.

Implementation: `src/theme/colors.ts`.

---

## 3. Typography

| Role | Face | Why |
|---|---|---|
| Display | **Fraunces** (optical serif) | At 92px the streak number reads warm and human. A geometric grotesk at that size reads as a dashboard metric — and this number is not a metric, it is the user's own record. |
| Body / UI | **Inter Tight** | Sets tighter than Inter proper, holds up in dense stat rows, does not compete with the serif. |

The scale is deliberately steep — hero at 92, next tier at 40. **Von Restorff effect**:
the isolated, distinct item is what gets recalled. The streak number is what we want
carried out of the app and into the moment the craving actually hits.

All numerics use tabular figures. A counter that shifts horizontally every second reads
as unstable, which is the opposite of what a streak display exists to convey.

Implementation: `src/theme/typography.ts`, `src/theme/fonts.ts`.

---

## 4. Form and touch

- **Radii are large and consistent.** Rounded contours are rated safer and more
  approachable than sharp ones (Bar & Neta) — sharp contours trigger a measurable threat
  response. Worth the pixels for an app opened mid-craving.

- **Touch targets are 52px, not the 44px minimum.** Fine motor control degrades under
  acute stress. A missed tap during a craving is a lost user. `OptionCard` rows are 56.

- **Surfaces are translucent glass, not opaque cards.** The sky is the progress signal;
  covering it with solid panels would hide it. Depth comes from a 1px top-edge highlight
  (light catching a raised rim), not a drop shadow — there is no opaque ground here for a
  shadow to fall onto. The tab bar is glass for the same reason: a solid bar would clip
  the exact band where the horizon warmth lives.

Implementation: `src/theme/layout.ts`, `src/ui/Card.tsx`, `src/ui/Button.tsx`.

---

## 5. The home screen

**Hero:** the day count, then a live `hh:mm:ss` that ticks.

The ticking timer is a **loss-aversion** device. Losses loom roughly twice as large as
equivalent gains (Kahneman & Tversky). A streak that visibly accrues second by second is
felt as a *holding with value*, not a score. The timer is a balance the user does not
want to give up.

**Milestone caption reads "4 days to 30", not "26 days done".** Goal-gradient effect
(Hull; Kivetz, Urminsky & Zheng): effort accelerates as a goal nears. Same fact, framed
against the near edge instead of the far one.

**The panic button sits above the fold**, thumb-reachable, before any stats. It is the
highest-stakes action in the app; everything else can be scrolled to.

Implementation: `app/(app)/home.tsx`, `src/ui/DayCounter.tsx`.

---

## 6. Panic mode

The screen that has to work when nothing else does. Four hard constraints:

1. **No alarm colour.** It steps *away* from the user's earned warm sky into a cool,
   desaturated field (`PANIC_SKY`). Making an emergency screen red would compound the
   arousal state the screen exists to bring down.

2. **The wave is named and timed.** Cravings peak and subside in roughly 3–5 minutes but
   feel unbounded from the inside. Urge-surfing (Marlatt) depends on the user believing
   the thing is finite, so the screen says so in plain words: *"This wave peaks in about
   three minutes, then it goes."* The round counter gives the container a visible end.

3. **Breathing before reasons.** The 4-7-8 pattern lengthens exhale relative to inhale,
   raising vagal tone and lowering heart rate — a physiological intervention that works
   whether or not the user believes in it. Only after ~38 seconds, once arousal has begun
   to turn, are their own stated reasons surfaced. Reason-giving needs the prefrontal
   capacity that the first minute is spent restoring.

4. **Haptics mark every phase change** so the rhythm can be followed with eyes closed —
   which is what people actually do, and what we want them to do.

The exit is `"I slipped — that's okay"`, styled in the care tone at equal weight to
`"It passed"`. A slip route styled as a failure button gets avoided, and an unlogged slip
is one the plan cannot adapt to.

Implementation: `app/panic.tsx`.

---

## 7. Relapse

The screen that decides whether the user stays or uninstalls.

- **No red, no warning icon, no "streak lost" banner.** See the abstinence violation
  effect above. This is styled as a log entry, not a verdict.

- **The sky steps back to dusk (0.22), never to night.** Resetting the visual to black
  would be both demoralising and, strictly, false — the majority of the progress is still
  there.

- **Lifetime vape-free days are shown *before* the trigger question.** Establish what is
  still standing before asking the user to look at what went wrong.

- **It asks for a trigger.** This converts a moment of self-blame into a moment of data
  collection. Attributing the lapse to a situation ("I was drinking", "I was stressed")
  rather than to character is the reattribution move at the centre of relapse-prevention
  therapy — and it is the only input that lets the plan actually adapt.

Implementation: `app/relapse.tsx`.

---

## 8. Health timeline

Drawn as a connected spine with a node per milestone.

This content is **genuinely ordinal** — 20 minutes, then 12 hours, then 2 weeks, in a
fixed biological order the user cannot skip. A connecting rule with a filled portion is
therefore honest structure, showing how far into the sequence the body actually is.

The same device on an unordered list would be a lie about the content, which is why
nothing else in the app uses it.

Locked milestones stay visible rather than hidden. Seeing what is coming is the
motivating part, and the goal-gradient pull only works if the goal is visible.

Implementation: `app/(app)/health.tsx`.

---

## 9. Copy rules

- Never "failed", "cheated", "broke your streak". The user slipped; the streak reset.
- Frame the streak as **held**, not earned: "still yours", "kept in your pocket".
- Tab labels are plain nouns for what you are looking for ("Today", "Body", "Others"),
  not feature names ("Home", "Health", "Community").
- Personalised numbers over generic claims. The paywall quotes the user's own weekly
  spend back to them; self-referent framing is recalled and acted on more reliably than
  the identical fact stated impersonally.

---

## 10. Files

```
src/theme/
  sky.ts          the ramp, skyProgress(), skyAt(), PANIC_SKY
  colors.ts       palette + the reasoning for each reserved channel
  typography.ts   Fraunces + Inter Tight scale
  layout.ts       spacing, radii, near-absent shadows
  motion.ts       durations and springs

src/ui/
  Sky.tsx         the gradient canvas + star field + horizon ember
  Screen.tsx      sky + safe area + gutters; accepts a sky override
  DayCounter.tsx  the home hero (replaced StreakRing)
  Stat.tsx        labelled figures, StatRow, StatDivider
  Card.tsx        translucent pane with a top-edge rim highlight
  Button.tsx      adds `care` and `reward` variants
```

`StreakRing` is retained in the barrel for the share card and achievements, but is no
longer the home hero.
