/**
 * Region-aware quit-support hotline (BUILD_PROMPT feature 14). Selection logic and data
 * are pure/testable (`src/domain/hotlines.ts`, `src/content/hotlines.json`); this hook
 * only adds the device-region lookup via the `Intl` runtime (Hermes supports `Intl` on
 * both platforms, so no extra native dependency/EAS rebuild is needed).
 *
 * Defaults to the US line when the region can't be determined or isn't covered.
 */
import { useMemo } from 'react';
import { Hotline, regionFromLocale, selectHotlineForRegion } from '@/domain/hotlines';
import hotlinesData from '@/content/hotlines.json';

const HOTLINES = hotlinesData as Hotline[];

function deviceRegion(): string | undefined {
  try {
    return regionFromLocale(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    return undefined;
  }
}

export function useHotline(): Hotline {
  return useMemo(() => selectHotlineForRegion(HOTLINES, deviceRegion()), []);
}
