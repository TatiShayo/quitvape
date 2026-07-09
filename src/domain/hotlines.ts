/**
 * Pure region-selection logic for quit-support hotlines (BUILD_PROMPT feature 14).
 * Data lives in `src/content/hotlines.json` (region-aware, US is the first/default
 * entry). Kept dependency-free so it is unit-testable in the domain suite; the actual
 * device-region lookup (which touches the `Intl` runtime) lives in
 * `src/app-core/useHotline.ts`.
 */

export interface Hotline {
  region: string;
  name: string;
  phone: string;
  /** tel: URL for one-tap dialing. */
  tel: string;
  url?: string;
}

/**
 * Picks the hotline matching `regionCode` (case-insensitive ISO 3166-1 alpha-2, e.g.
 * from `Intl.DateTimeFormat().resolvedOptions().locale`). Falls back to the first entry
 * in the list (US) when the region is unknown, undefined, or not covered.
 */
export function selectHotlineForRegion(hotlines: Hotline[], regionCode: string | undefined): Hotline {
  const fallback = hotlines[0];
  if (!regionCode) return fallback;
  const normalized = regionCode.trim().toUpperCase();
  return hotlines.find((h) => h.region.toUpperCase() === normalized) ?? fallback;
}

/** Extracts an ISO region code (e.g. "US", "GB") from a BCP-47 locale tag like "en-US". */
export function regionFromLocale(locale: string | undefined): string | undefined {
  if (!locale) return undefined;
  const parts = locale.split(/[-_]/);
  // BCP-47: language[-script][-region]. Region is 2 alpha or 3 digit; script is 4 alpha.
  const region = parts.find((p, i) => i > 0 && /^[A-Za-z]{2}$|^[0-9]{3}$/.test(p));
  return region?.toUpperCase();
}
