import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Card, Screen } from '@/ui';
import { colors, radii, spacing } from '@/theme';
import { AnalyticsEvent, getAnalytics, getErrors, getPurchasesProvider } from '@/providers';
import { Offering, PackageId } from '@/providers/types';
import { useOnboardingStore, useQuitStore } from '@/store';
import { buildPlanFromAnswers } from '@/app-core/buildPlan';
import { formatMoney, savingsProjection } from '@/domain/money';
import { dependencyScore } from '@/domain/dependency';

export default function Paywall() {
  const router = useRouter();
  const answers = useOnboardingStore((s) => s.answers);
  const startPlan = useQuitStore((s) => s.startPlan);
  const [offering, setOffering] = useState<Offering | null>(null);
  const [selected, setSelected] = useState<PackageId>('weekly');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Their numbers (personalized proof, PLAYBOOK 4.1).
  const weeklySpend = answers.vapeCostPerWeek ?? 25;
  const oneYear = savingsProjection(weeklySpend).oneYear;
  const score = dependencyScore({
    firstPuffOnWaking: answers.firstPuffOnWaking ?? false,
    puffsPerDay: answers.puffsPerDay ?? 150,
    yearsVaping: answers.yearsVaping ?? 2,
    failedQuitAttempts: answers.failedQuitAttempts ?? 1,
    nicotineStrengthMgMl: answers.nicotineStrengthMgMl,
  });

  useEffect(() => {
    const purchases = getPurchasesProvider();
    getAnalytics().capture(AnalyticsEvent.paywallViewed);
    void purchases
      .init()
      .then(() => purchases.getOffering())
      .then((o) => {
        setOffering(o);
        setSelected(o.defaultPackageId);
      })
      .catch((e) => {
        getErrors().captureException(e, { where: 'paywall.getOffering' });
        setError('Plans could not load. Please try again.');
      });
  }, []);

  function commitPlanAndEnter() {
    startPlan(buildPlanFromAnswers(answers));
    router.replace('/(app)/home');
  }

  async function onPurchase() {
    setBusy(true);
    setError(null);
    try {
      const result = await getPurchasesProvider().purchase(selected);
      if (result.status === 'success') {
        getAnalytics().capture(AnalyticsEvent.purchaseCompleted, { plan: selected });
        if (result.entitlement.inTrial) getAnalytics().capture(AnalyticsEvent.trialStarted);
        commitPlanAndEnter();
      } else if (result.status === 'error') {
        setError(result.message);
      }
    } catch (e) {
      getErrors().captureException(e, { where: 'paywall.purchase' });
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function onRestore() {
    setBusy(true);
    setError(null);
    try {
      const status = await getPurchasesProvider().restore();
      if (status.isPremium) {
        getAnalytics().capture(AnalyticsEvent.purchaseRestored);
        commitPlanAndEnter();
      } else {
        setError('No previous purchase found for this account.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll>
      <AppText variant="overline" color="accent">
        Your quit plan is ready
      </AppText>
      <AppText variant="displayM" style={styles.headline}>
        Quit for good — starting today
      </AppText>

      <Card style={styles.proofCard}>
        <View style={styles.proofRow}>
          <View>
            <AppText variant="caption" color="textTertiary">
              Dependency score
            </AppText>
            <AppText variant="displayM" tabular>
              {score.toFixed(1)}
              <AppText variant="title" color="textTertiary"> /10</AppText>
            </AppText>
          </View>
          <View>
            <AppText variant="caption" color="textTertiary">
              You could save (1 yr)
            </AppText>
            <AppText variant="displayM" color="money" tabular>
              ${formatMoney(oneYear)}
            </AppText>
          </View>
        </View>
        <AppText variant="caption" color="textTertiary" style={styles.proofNote}>
          This app costs less than two weeks of vaping.
        </AppText>
      </Card>

      <View style={styles.plans}>
        {offering?.packages.map((pkg) => {
          const isSel = pkg.id === selected;
          return (
            <Pressable
              key={pkg.id}
              onPress={() => setSelected(pkg.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSel }}
              style={[styles.plan, isSel && styles.planSelected]}
            >
              <View style={styles.planHeader}>
                <AppText variant="bodyStrong">{pkg.title}</AppText>
                {pkg.id === 'lifetime' ? (
                  <View style={styles.badge}>
                    <AppText variant="overline" color="textInverse">
                      82% OFF
                    </AppText>
                  </View>
                ) : pkg.trialDays ? (
                  <View style={styles.badge}>
                    <AppText variant="overline" color="textInverse">
                      {pkg.trialDays}-DAY FREE TRIAL
                    </AppText>
                  </View>
                ) : null}
              </View>
              <AppText variant="title" tabular>
                {pkg.priceString}
                {pkg.id === 'weekly' ? (
                  <AppText variant="body" color="textTertiary"> / week</AppText>
                ) : (
                  <AppText variant="body" color="textTertiary"> one-time</AppText>
                )}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <AppText variant="caption" color="danger" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <Button
        label={selected === 'weekly' ? 'Start my free trial' : 'Unlock lifetime access'}
        onPress={onPurchase}
        loading={busy}
        haptic
        style={styles.cta}
      />
      <AppText variant="caption" color="textTertiary" center>
        Cancel anytime. Testimonials shown in-app are placeholders until real ones exist.
      </AppText>
      <Button label="Restore purchases" onPress={onRestore} variant="ghost" disabled={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headline: { marginTop: spacing.sm, marginBottom: spacing.xl },
  proofCard: { marginBottom: spacing.xl },
  proofRow: { flexDirection: 'row', justifyContent: 'space-between' },
  proofNote: { marginTop: spacing.md },
  plans: { gap: spacing.md, marginBottom: spacing.lg },
  plan: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  planSelected: { borderColor: colors.accent, backgroundColor: colors.surfaceElevated },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  cta: { marginBottom: spacing.md },
  error: { marginBottom: spacing.md },
});
