/**
 * Purchases provider selector. Real RevenueCat when a key is configured, else the dev
 * mock (auto-grants entitlement in dev). Singleton so listeners/state are shared.
 */
import { env } from '@/config/env';
import { PurchasesProvider } from '../types';
import { createMockPurchases } from './mockPurchases';
import { createRevenueCatPurchases } from './revenueCatPurchases';

let instance: PurchasesProvider | null = null;

export function getPurchasesProvider(): PurchasesProvider {
  if (instance) return instance;
  instance =
    env.revenueCat.configured && env.revenueCat.apiKey
      ? createRevenueCatPurchases(env.revenueCat.apiKey)
      : createMockPurchases();
  return instance;
}

export type { PurchasesProvider };
