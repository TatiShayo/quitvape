# SPEC 001: Habit Cessation & Physiological Recovery Engine

## Problem Statement
Young adults trying to quit vaping struggle with intense cravings and give up after minor relapses when apps wipe all their progress.

## Solution
A behavioral cessation mobile application featuring verified physiological recovery milestones, emergency craving relief, and resilient streak tracking.

## User Stories
1. As a recovering user, I want to see my body's physical healing milestones unlocked in real time, so that I stay motivated.
2. As a user experiencing a severe craving, I want an instant 90-second calming exercise, so that I don't give in to the urge.
3. As a user who slipped, I want my lifetime money saved preserved, so that I feel encouraged to restart my streak.

## Implementation Decisions
- Milestone calculation in `src/domain/milestones.ts`.
- Craving intervention in `src/domain/cravings.ts`.

## Testing Decisions
- Seam: `src/domain/__tests__/habit-milestone-triggers.test.ts`.
- Verify milestone calculation accuracy across 8hr, 24hr, 72hr, and 30-day thresholds.
