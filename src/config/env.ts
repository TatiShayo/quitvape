/**
 * Central env/config reader. Every third-party key is optional at build time — when a
 * key is absent, the corresponding provider falls back to a mock and we log it under
 * NEEDS HUMAN (see PROJECT_STATE.md). Never stall on a missing key (BUILD_PROMPT).
 *
 * Only EXPO_PUBLIC_* values are readable in the app bundle. The Anthropic key is a
 * server-only edge secret and is intentionally NOT read here.
 */
import { Platform } from 'react-native';

function read(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

const supabaseUrl = read(process.env.EXPO_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = read(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
const revenueCatIos = read(process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY);
const revenueCatAndroid = read(process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY);
const posthogKey = read(process.env.EXPO_PUBLIC_POSTHOG_KEY);
const posthogHost = read(process.env.EXPO_PUBLIC_POSTHOG_HOST) ?? 'https://us.i.posthog.com';
const sentryDsn = read(process.env.EXPO_PUBLIC_SENTRY_DSN);

const revenueCatKey = Platform.select({
  ios: revenueCatIos,
  android: revenueCatAndroid,
  default: revenueCatIos ?? revenueCatAndroid,
});

export const env = {
  isDev: __DEV__,

  supabase: {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    configured: Boolean(supabaseUrl && supabaseAnonKey),
  },
  revenueCat: {
    apiKey: revenueCatKey,
    configured: Boolean(revenueCatKey),
  },
  posthog: {
    apiKey: posthogKey,
    host: posthogHost,
    configured: Boolean(posthogKey),
  },
  sentry: {
    dsn: sentryDsn,
    configured: Boolean(sentryDsn),
  },
} as const;

/** Human-readable list of missing keys, surfaced in dev logs on startup. */
export function missingKeys(): string[] {
  const missing: string[] = [];
  if (!env.supabase.configured) missing.push('EXPO_PUBLIC_SUPABASE_URL/ANON_KEY');
  if (!env.revenueCat.configured) missing.push('EXPO_PUBLIC_REVENUECAT_IOS_KEY/ANDROID_KEY');
  if (!env.posthog.configured) missing.push('EXPO_PUBLIC_POSTHOG_KEY');
  if (!env.sentry.configured) missing.push('EXPO_PUBLIC_SENTRY_DSN');
  return missing;
}
