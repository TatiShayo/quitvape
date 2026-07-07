/**
 * Returns a function that wipes all LOCAL persisted state (quit/onboarding/settings).
 * Server-side rows are deleted separately via the backend provider. Together these
 * satisfy the Apple/GDPR "delete all my data" requirement (BUILD_PROMPT security).
 */
import { useCallback } from 'react';
import { useOnboardingStore, useQuitStore, useSettingsStore } from '@/store';

export function useLocalDataWipe() {
  const resetQuit = useQuitStore((s) => s.resetAll);
  const clearOnboarding = useOnboardingStore((s) => s.clear);
  const resetSettings = useSettingsStore((s) => s.reset);

  return useCallback(() => {
    resetQuit();
    clearOnboarding();
    resetSettings();
  }, [resetQuit, clearOnboarding, resetSettings]);
}
