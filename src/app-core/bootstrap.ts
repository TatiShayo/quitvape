/**
 * One-time app bootstrap: init error monitoring + analytics, ensure an anon backend
 * session, and log any missing provider keys under NEEDS HUMAN in dev. Never throws —
 * a failed optional provider must not block the app (mocks cover the gap).
 */
import { getAnalytics, getBackend, getErrors, getPurchasesProvider } from '@/providers';
import { missingKeys } from '@/config/env';

let started = false;

export async function bootstrap(): Promise<void> {
  if (started) return;
  started = true;

  const errors = getErrors();
  errors.init();

  if (__DEV__) {
    const missing = missingKeys();
    if (missing.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        '[QuitVape] Running with mock providers for missing keys (NEEDS HUMAN):\n  - ' +
          missing.join('\n  - '),
      );
    }
  }

  try {
    await getAnalytics().init();
  } catch (e) {
    errors.captureException(e, { where: 'analytics.init' });
  }

  try {
    await getPurchasesProvider().init();
  } catch (e) {
    errors.captureException(e, { where: 'purchases.init' });
  }

  try {
    const backend = getBackend();
    const userId = await backend.ensureAnonSession();
    // Only the opaque anon id is set on error/analytics identity — no PII.
    errors.setUser(userId);
    getAnalytics().identify(userId);
  } catch (e) {
    errors.captureException(e, { where: 'backend.ensureAnonSession' });
  }
}
