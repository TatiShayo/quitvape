# CONTEXT.md — Ubiquitous Domain Language (QuitVape)

## Core Entities
- **CessationStreak**: Contiguous period of nicotine-free time measured in hours and days.
- **HealthMilestone**: Physiologically verified recovery benchmark unlocked at defined hourly intervals.
- **CravingIntervention**: 90-second sensory and breathing exercise deployed during acute craving episodes.
- **FinancialSavingsTracker**: Real-time accumulator calculating money preserved from unpurchased vape pods.

## Domain Invariants
- Health milestones can only unlock when the user's active streak duration exceeds the milestone's required hours.
- A relapse event resets the active streak but preserves cumulative lifetime money saved and milestone history.

## Forbidden Terminology
- Do not call slips "failures"; use "RelapseEvent".
- Do not refer to vaping as "smoking"; use "Vaping" or "NicotineUse".
