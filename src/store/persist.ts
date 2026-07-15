/** Shared AsyncStorage-backed persist storage for zustand stores. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

export const asyncStorage = createJSONStorage(() => AsyncStorage);

/**
 * Migration guard (REVIEW_FINDINGS H3): zustand's persist middleware DISCARDS the
 * persisted state when the stored version differs and no `migrate` is provided —
 * for this app that would silently wipe the user's quit date/streak/relapses on any
 * future schema bump or downgrade. Every store must pass a `migrate` built with this
 * helper: it carries known fields forward on top of the store's defaults, so unknown
 * or older payloads degrade gracefully instead of being dropped.
 */
export function makeMigrate<S extends object>(defaults: S) {
  return (persisted: unknown): S => {
    if (persisted === null || typeof persisted !== 'object') return defaults;
    const out: S = { ...defaults };
    const source = persisted as Record<string, unknown>;
    for (const key of Object.keys(defaults) as (keyof S)[]) {
      const value = source[key as string];
      if (value !== undefined) out[key] = value as S[keyof S];
    }
    return out;
  };
}
