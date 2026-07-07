/**
 * Entitlement hook. Re-checks premium status on app foreground (RevenueCat hygiene:
 * "entitlement re-check on app foreground") and subscribes to live changes. Caches the
 * flag into the settings store for fast gating before the async check resolves.
 */
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getPurchasesProvider } from '@/providers';
import { EntitlementStatus } from '@/providers/types';
import { useSettingsStore } from '@/store';

export function useEntitlement() {
  const cachedPremium = useSettingsStore((s) => s.cachedPremium);
  const setCachedPremium = useSettingsStore((s) => s.setCachedPremium);
  const [status, setStatus] = useState<EntitlementStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const purchases = getPurchasesProvider();
    let mounted = true;

    async function refresh() {
      try {
        const s = await purchases.getEntitlement();
        if (!mounted) return;
        setStatus(s);
        setCachedPremium(s.isPremium);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void purchases.init().then(refresh);

    const unsub = purchases.onEntitlementChange((s) => {
      if (!mounted) return;
      setStatus(s);
      setCachedPremium(s.isPremium);
    });

    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refresh();
    });

    return () => {
      mounted = false;
      unsub();
      appStateSub.remove();
    };
  }, [setCachedPremium]);

  return {
    isPremium: status?.isPremium ?? cachedPremium,
    inTrial: status?.inTrial ?? false,
    isMock: status?.isMock ?? false,
    loading,
  };
}
