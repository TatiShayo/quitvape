/**
 * Central routing gate. Decides the destination based on: age confirmation, whether a
 * quit plan exists (quiz completed), and premium entitlement. Hard paywall — no app
 * access without an active entitlement/trial (BUILD_PROMPT).
 */
import { useOnboardingStore, useQuitStore } from '@/store';
import { useEntitlement } from './useEntitlement';

export type GateTarget = 'loading' | 'age-gate' | 'onboarding' | 'paywall' | 'app';

export function useAppGate(): { target: GateTarget; loading: boolean } {
  const ageConfirmed = useOnboardingStore((s) => s.ageConfirmed);
  const hasPlan = useQuitStore((s) => s.plan !== null);
  const { isPremium, loading } = useEntitlement();

  if (loading) return { target: 'loading', loading: true };
  if (!ageConfirmed) return { target: 'age-gate', loading: false };
  if (!hasPlan) return { target: 'onboarding', loading: false };
  if (!isPremium) return { target: 'paywall', loading: false };
  return { target: 'app', loading: false };
}
