/**
 * Error monitoring provider (Sentry). No-op mock when unconfigured.
 *
 * PRIVACY: no quit/relapse/craving data, no PII in events. Request bodies scrubbed via
 * beforeSend. setUser stores only the opaque anon id (not tied to identity elsewhere).
 */
import * as Sentry from '@sentry/react-native';
import { env } from '@/config/env';
import { ErrorProvider } from '../types';

function createNoopErrors(): ErrorProvider {
  return {
    init() {},
    captureException(error) {
      if (__DEV__) console.warn('[errors:mock]', error);
    },
    captureMessage() {},
    setUser() {},
  };
}

function createSentryErrors(dsn: string): ErrorProvider {
  let started = false;
  return {
    init() {
      if (started) return;
      Sentry.init({
        dsn,
        enableAutoSessionTracking: true,
        // Scrub potentially sensitive request/response bodies before send (PLAYBOOK 2.7).
        beforeSend(event) {
          if (event.request) delete event.request.data;
          return event;
        },
      });
      started = true;
    },
    captureException(error, context) {
      Sentry.captureException(error, context ? { extra: context } : undefined);
    },
    captureMessage(message) {
      Sentry.captureMessage(message);
    },
    setUser(id) {
      Sentry.setUser(id ? { id } : null);
    },
  };
}

let instance: ErrorProvider | null = null;

export function getErrors(): ErrorProvider {
  if (instance) return instance;
  instance =
    env.sentry.configured && env.sentry.dsn
      ? createSentryErrors(env.sentry.dsn)
      : createNoopErrors();
  return instance;
}
