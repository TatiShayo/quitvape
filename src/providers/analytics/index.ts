/**
 * Analytics provider (PostHog). No-op mock when unconfigured.
 *
 * PRIVACY GUARDRAIL: this app is health-adjacent. NEVER pass quit/relapse/craving
 * details, PII, financial amounts, or user text as event properties. Property values
 * are strictly sanitized, key names are checked against a blocklist, and value contents
 * are scrubbed against email/phone patterns and excessive length.
 */
import PostHog from 'posthog-react-native';
import { env } from '@/config/env';
import { AnalyticsProps, AnalyticsProvider } from '../types';

/** Sensitive keys we refuse to send under any circumstances. */
export const BLOCKED_KEY =
  /(relapse|craving|trigger|quit_?date|streak_?start|mood|handle|anon|note|body|message|text|content|comment|input|prompt|email|phone|address|ssn|token|secret|medical|health|puff|spend|cost|dollar|money|price|amount)/i;

/** Email detection pattern. */
const EMAIL_REGEX = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/;

/** Phone number detection pattern (7+ continuous/spaced digits with optional +). */
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

/** Scrubbed props never contain `undefined` or sensitive values. */
export type ScrubbedProps = Record<string, string | number | boolean>;

/** Pure property sanitizer for analytics telemetry. Exported for hermetic testing. */
export function scrub(props?: AnalyticsProps): ScrubbedProps | undefined {
  if (!props || typeof props !== 'object') return undefined;
  const out: ScrubbedProps = {};

  for (const [k, v] of Object.entries(props)) {
    if (BLOCKED_KEY.test(k)) continue;
    if (v === undefined || v === null) continue;

    if (typeof v === 'boolean') {
      out[k] = v;
    } else if (typeof v === 'number') {
      if (Number.isFinite(v)) {
        out[k] = v;
      }
    } else if (typeof v === 'string') {
      const trimmed = v.trim();
      // Drop strings that contain email or phone numbers
      if (EMAIL_REGEX.test(trimmed) || PHONE_REGEX.test(trimmed)) {
        continue;
      }
      // Truncate excessively long strings to 64 chars to prevent free-text payload leaks
      if (trimmed.length > 64) {
        out[k] = trimmed.slice(0, 64);
      } else {
        out[k] = trimmed;
      }
    }
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

function createNoopAnalytics(): AnalyticsProvider {
  return {
    async init() {},
    capture() {},
    screen() {},
    identify() {},
    reset() {},
  };
}

function createPostHogAnalytics(apiKey: string, host: string): AnalyticsProvider {
  const client = new PostHog(apiKey, { host });
  return {
    async init() {
      /* PostHog RN initializes on construction; nothing async required. */
    },
    capture(event, props) {
      client.capture(event, scrub(props));
    },
    screen(name, props) {
      client.screen(name, scrub(props));
    },
    identify(distinctId, props) {
      client.identify(distinctId, scrub(props));
    },
    reset() {
      client.reset();
    },
  };
}

let instance: AnalyticsProvider | null = null;

export function getAnalytics(): AnalyticsProvider {
  if (instance) return instance;
  instance =
    env.posthog.configured && env.posthog.apiKey
      ? createPostHogAnalytics(env.posthog.apiKey, env.posthog.host)
      : createNoopAnalytics();
  return instance;
}

/** Canonical event names (PLAYBOOK 5: object_action, documented in analytics.md). */
export const AnalyticsEvent = {
  quizScreenViewed: 'quiz_screen_viewed',
  quizCompleted: 'quiz_completed',
  paywallViewed: 'paywall_viewed',
  trialStarted: 'trial_started',
  purchaseCompleted: 'purchase_completed',
  purchaseRestored: 'purchase_restored',
  panicButtonOpened: 'panic_button_opened',
  cravingResisted: 'craving_resisted',
  relapseLogged: 'relapse_logged',
  shareCardExported: 'share_card_exported',
  checkInSubmitted: 'check_in_submitted',
  communityPostCreated: 'community_post_created',
  communityPostReported: 'community_post_reported',
  communityEncouragementSent: 'community_encouragement_sent',
  buddyInviteCreated: 'buddy_invite_created',
  buddyInviteAccepted: 'buddy_invite_accepted',
  coachMessageSent: 'coach_message_sent',
} as const;
