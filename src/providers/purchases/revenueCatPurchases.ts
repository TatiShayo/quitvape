/**
 * Real RevenueCat-backed purchases provider. Used only when a RevenueCat key is
 * configured. Pricing/copy come from the remote Offering (never hardcoded), so price
 * tests need no app update (BUILD_PROMPT RevenueCat hygiene).
 *
 * The premium entitlement identifier is "premium" — configure it in RevenueCat.
 */
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';
import {
  EntitlementStatus,
  Offering,
  PackageId,
  PurchasePackage,
  PurchaseResult,
  PurchasesProvider,
} from '../types';

const ENTITLEMENT_ID = 'premium';

/** Map a RevenueCat package to our domain PackageId by package type / identifier. */
function toPackageId(pkg: PurchasesPackage): PackageId | undefined {
  const type = pkg.packageType;
  const id = pkg.identifier.toLowerCase();
  if (type === 'WEEKLY' || id.includes('weekly') || id.includes('week')) return 'weekly';
  if (type === 'LIFETIME' || id.includes('lifetime') || id.includes('life')) return 'lifetime';
  return undefined;
}

function mapPackage(pkg: PurchasesPackage, id: PackageId): PurchasePackage {
  const product = pkg.product;
  const intro = product.introPrice;
  const trialDays =
    intro && intro.price === 0 ? introToDays(intro.periodUnit, intro.periodNumberOfUnits) : undefined;
  return {
    id,
    productId: product.identifier,
    priceString: product.priceString,
    price: product.price,
    currencyCode: product.currencyCode,
    trialDays,
    title: id === 'weekly' ? 'Weekly' : 'Lifetime',
    perWeekString: id === 'weekly' ? `${product.priceString}/week` : 'one-time',
  };
}

function introToDays(periodUnit: string, n: number): number {
  switch (periodUnit.toUpperCase()) {
    case 'DAY':
      return n;
    case 'WEEK':
      return n * 7;
    case 'MONTH':
      return n * 30;
    default:
      return n;
  }
}

function mapOffering(offering: PurchasesOffering): Offering {
  const packages: PurchasePackage[] = [];
  for (const pkg of offering.availablePackages) {
    const id = toPackageId(pkg);
    if (id && !packages.some((p) => p.id === id)) packages.push(mapPackage(pkg, id));
  }
  return {
    identifier: offering.identifier,
    packages,
    defaultPackageId: packages.some((p) => p.id === 'weekly') ? 'weekly' : 'lifetime',
  };
}

function mapEntitlement(info: CustomerInfo): EntitlementStatus {
  const ent = info.entitlements.active[ENTITLEMENT_ID];
  if (!ent) return { isPremium: false, inTrial: false, isMock: false };
  return {
    isPremium: ent.isActive,
    inTrial: ent.periodType?.toUpperCase() === 'TRIAL',
    expiresAt: ent.expirationDate ?? undefined,
    isMock: false,
  };
}

export function createRevenueCatPurchases(apiKey: string): PurchasesProvider {
  let configured = false;
  let rawOffering: PurchasesOffering | null = null;

  return {
    async init(appUserId?: string) {
      if (!configured) {
        Purchases.configure({ apiKey, appUserID: appUserId ?? null });
        configured = true;
      } else if (appUserId) {
        await Purchases.logIn(appUserId);
      }
    },
    async getOffering() {
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (!current) throw new Error('No current RevenueCat offering configured.');
      rawOffering = current;
      return mapOffering(current);
    },
    async getEntitlement() {
      const info = await Purchases.getCustomerInfo();
      return mapEntitlement(info);
    },
    async purchase(packageId: PackageId): Promise<PurchaseResult> {
      try {
        if (!rawOffering) rawOffering = (await Purchases.getOfferings()).current;
        const pkg = rawOffering?.availablePackages.find((p) => toPackageId(p) === packageId);
        if (!pkg) return { status: 'error', message: 'That plan is not available right now.' };
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        return { status: 'success', entitlement: mapEntitlement(customerInfo) };
      } catch (e) {
        const err = e as { userCancelled?: boolean; message?: string };
        if (err.userCancelled) return { status: 'cancelled' };
        return { status: 'error', message: 'Purchase could not be completed. Please try again.' };
      }
    },
    async restore() {
      const info = await Purchases.restorePurchases();
      return mapEntitlement(info);
    },
    onEntitlementChange(listener) {
      const handler = (info: CustomerInfo) => listener(mapEntitlement(info));
      Purchases.addCustomerInfoUpdateListener(handler);
      return () => Purchases.removeCustomerInfoUpdateListener(handler);
    },
  };
}
