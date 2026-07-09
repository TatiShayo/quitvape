/**
 * Compliance copy (BUILD_PROMPT feature 14). Region-aware quit-support hotline data now
 * lives in `src/content/hotlines.json` with selection logic in `src/domain/hotlines.ts`
 * and device-region lookup in `src/app-core/useHotline.ts` — use `useHotline()` rather
 * than a static import so the right region surfaces in Settings and the panic flow.
 */

export const NOT_MEDICAL_ADVICE =
  'QuitVape offers motivational support and is not medical advice. It is not a substitute for professional healthcare. If you have health concerns, talk to a doctor.';

export const AGE_GATE_TITLE = 'Are you 18 or older?';
export const AGE_GATE_BODY =
  'QuitVape is intended for adults working to quit nicotine vaping. You must be 18+ to continue.';

export type { Hotline } from '@/domain/hotlines';
