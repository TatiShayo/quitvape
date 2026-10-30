/**
 * Typed provider interfaces. Every external service is accessed through one of these,
 * so the app is identical whether backed by a real SDK or a mock (BUILD_PROMPT: "mocks
 * behind typed provider interfaces for every missing key").
 */
import { EncouragementPresetId } from '@/content/encouragements';

// Purchases / entitlements (RevenueCat)

export type PackageId = 'weekly' | 'lifetime';

export interface PurchasePackage {
  id: PackageId;
  /** RevenueCat store product identifier. */
  productId: string;
  /** Localized price string, e.g. "$5.99". Comes from the store; never hardcoded. */
  priceString: string;
  /** Price in the store's currency, for computing derived framing. */
  price: number;
  currencyCode: string;
  /** Free-trial length in days if the package has an intro trial. */
  trialDays?: number;
  title: string;
  /** Per-week framing string for weekly; per-month for annual/lifetime anchors. */
  perWeekString?: string;
}

export interface Offering {
  identifier: string;
  packages: PurchasePackage[];
  /** Package pre-selected in the paywall (weekly-with-trial by default). */
  defaultPackageId: PackageId;
}

export interface EntitlementStatus {
  /** True when the user has an active "premium" entitlement (trial counts as active). */
  isPremium: boolean;
  /** True while the user is inside a free trial period. */
  inTrial: boolean;
  /** ISO string of when the current entitlement expires, if known. */
  expiresAt?: string;
  /** True if this status came from a dev mock rather than a real store. */
  isMock: boolean;
}

export type PurchaseResult =
  | { status: 'success'; entitlement: EntitlementStatus }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

export interface PurchasesProvider {
  /** Idempotent SDK init; safe to call more than once. */
  init(appUserId?: string): Promise<void>;
  getOffering(): Promise<Offering>;
  getEntitlement(): Promise<EntitlementStatus>;
  purchase(packageId: PackageId): Promise<PurchaseResult>;
  restore(): Promise<EntitlementStatus>;
  /** Subscribe to entitlement changes (e.g. RevenueCat listener). Returns unsubscribe. */
  onEntitlementChange(listener: (status: EntitlementStatus) => void): () => void;
}

// Analytics (PostHog). NEVER pass quit/relapse/craving data as properties.

export type AnalyticsProps = Record<string, string | number | boolean | undefined>;

export interface AnalyticsProvider {
  init(): Promise<void>;
  capture(event: string, props?: AnalyticsProps): void;
  screen(name: string, props?: AnalyticsProps): void;
  identify(distinctId: string, props?: AnalyticsProps): void;
  reset(): void;
}

// Error monitoring (Sentry). Scrub PII; no quit/relapse data.

export interface ErrorProvider {
  init(): void;
  captureException(error: unknown, context?: Record<string, unknown>): void;
  captureMessage(message: string): void;
  setUser(id: string | undefined): void;
}

// Backend (Supabase). Anonymous, device-bound auth.

export interface CommunityPost {
  id: string;
  anonHandle: string;
  body: string;
  streakDays: number;
  createdAt: string;
  reportCount: number;
  /** Counts per preset encouragement id (BUILD_PROMPT: "tap-to-send preset encouragements"). */
  encouragements: Partial<Record<EncouragementPresetId, number>>;
}

export interface BuddyInfo {
  /** Row id of the pairing (not either user's identity). */
  id: string;
  /** True once a second user has accepted the invite. */
  paired: boolean;
  /** Deep-link invite token, present while awaiting a pairing. */
  inviteToken?: string;
  buddyAnonHandle?: string;
  buddyStreakDays?: number;
  pairedAt?: string;
}

export interface BackendProvider {
  /** Ensure an anonymous session exists; returns the anon user id. */
  ensureAnonSession(): Promise<string>;
  getCurrentUserId(): string | undefined;
  listCommunityPosts(limit?: number): Promise<CommunityPost[]>;
  createCommunityPost(input: { body: string; streakDays: number }): Promise<CommunityPost>;
  reportPost(postId: string): Promise<void>;
  /** Tap-to-send preset reaction; no free text (moderation-load kill per BUILD_PROMPT). */
  sendEncouragement(postId: string, presetId: EncouragementPresetId): Promise<void>;
  /** Accountability buddy (BUILD_PROMPT feature 12). */
  getBuddy(): Promise<BuddyInfo | null>;
  createBuddyInvite(): Promise<BuddyInfo>;
  acceptBuddyInvite(token: string): Promise<BuddyInfo>;
  /** Tap-to-send preset only (no chat), scoped to one active buddy pairing. */
  sendBuddyEncouragement(buddyId: string, presetId: EncouragementPresetId): Promise<void>;
  /**
   * Pushes only the current streak day count to the narrow `buddy_streaks` table (the
   * one deliberate exception to "health data stays local" — readable ONLY by this
   * user and whoever they are currently paired with; see the migration for the RLS).
   */
  syncMyStreak(streakDays: number): Promise<void>;
  /** GDPR / Apple: wipe all of this user's server rows. */
  deleteAllUserData(): Promise<void>;
  /** AI coach (Anthropic claude-haiku-4-5): send message, get response. Server-side cap: 10 msgs/day, ≤120 words. */
  sendCoachMessage(message: string): Promise<string>;
  isMock: boolean;
}
