/**
 * Mock purchases provider. Used whenever no RevenueCat key is configured.
 * In dev, purchase()/restore() auto-grant the premium entitlement so the full flow
 * (quiz -> paywall -> home) is walkable without a store account (BUILD_PROMPT).
 *
 * Prices below are PLACEHOLDERS that mirror the intended RevenueCat Offering. Real
 * pricing is remote-configured in RevenueCat and must never be hardcoded for release.
 */
import {
  EntitlementStatus,
  Offering,
  PackageId,
  PurchaseResult,
  PurchasesProvider,
} from '../types';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const MOCK_OFFERING: Offering = {
  identifier: 'mock_default',
  defaultPackageId: 'weekly',
  packages: [
    {
      id: 'weekly',
      productId: 'quitvape_weekly_599',
      priceString: '$5.99',
      price: 5.99,
      currencyCode: 'USD',
      trialDays: 3,
      title: 'Weekly',
      perWeekString: '$5.99/week',
    },
    {
      id: 'lifetime',
      productId: 'quitvape_lifetime_2999',
      priceString: '$29.99',
      price: 29.99,
      currencyCode: 'USD',
      title: 'Lifetime',
      perWeekString: 'one-time',
    },
  ],
};

function grantedStatus(inTrial: boolean): EntitlementStatus {
  return {
    isPremium: true,
    inTrial,
    expiresAt: new Date(Date.now() + WEEK_MS).toISOString(),
    isMock: true,
  };
}

const NOT_GRANTED: EntitlementStatus = { isPremium: false, inTrial: false, isMock: true };

export function createMockPurchases(): PurchasesProvider {
  let status: EntitlementStatus = { ...NOT_GRANTED };
  const listeners = new Set<(s: EntitlementStatus) => void>();

  function emit() {
    for (const l of listeners) l(status);
  }

  return {
    async init() {
      /* no-op for mock */
    },
    async getOffering() {
      return MOCK_OFFERING;
    },
    async getEntitlement() {
      return status;
    },
    async purchase(packageId: PackageId): Promise<PurchaseResult> {
      // Dev-only auto-grant. In a non-dev mock build we refuse rather than fake a sale.
      if (!__DEV__) {
        return {
          status: 'error',
          message: 'Purchases are unavailable: billing is not configured for this build.',
        };
      }
      status = grantedStatus(packageId === 'weekly');
      emit();
      return { status: 'success', entitlement: status };
    },
    async restore() {
      if (__DEV__) {
        status = grantedStatus(false);
        emit();
      }
      return status;
    },
    onEntitlementChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
