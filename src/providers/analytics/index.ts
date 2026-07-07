/**
 * Analytics provider (PostHog). No-op mock when unconfigured.
 *
 * PRIVACY GUARDRAIL: this app is health-adjacent. NEVER pass quit/relapse/craving
 * details as event properties. Property values are constrained to primitives and a
 * runtime scrubber drops any key that looks like it carries sensitive content.
 */
import PostHog from 'posthog-react-native';
import { env } from '@/config/env';
import { AnalyticsProps, AnalyticsProvider } from '../types';

/** Keys we refuse to send even if a caller passes them by mistake. */
const BLOCKED_KEY = /(relapse|craving|trigger|quit_?date|mood|handle|note|body|message)/i;

function scrub(props?: AnalyticsProps): AnalyticsProps | undefined {
  if (!props) return undefined;
  const out: AnalyticsProps = {};
  for (const [k, v] of Object.entries(props)) {
    if (BLOCKED_KEY.test(k)) continue;
    if (v !== undefined) out[k] = v;
  }
  return out;
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
} as const;
