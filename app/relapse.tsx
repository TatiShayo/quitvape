import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Card, OptionCard, Screen } from '@/ui';
import { spacing } from '@/theme';
import { useQuitStore } from '@/store';
import { CravingTrigger } from '@/domain/types';
import { lifetimeVapeFreeDays } from '@/domain/streak';
import { RELAPSE_HEADLINE, TRIGGER_OPTIONS, planTipForTrigger, relapseBody } from '@/content/relapse';
import { AnalyticsEvent, getAnalytics } from '@/providers';

/**
 * Relapse compassion flow (BUILD_PROMPT feature 5). Reached from the panic button's
 * "I slipped" action. Logs the relapse with a real trigger (not a placeholder), shows
 * that the lifetime vape-free stat keeps counting, and surfaces one tailored plan tip.
 */
export default function Relapse() {
  const router = useRouter();
  const plan = useQuitStore((s) => s.plan);
  const relapses = useQuitStore((s) => s.relapses);
  const logRelapse = useQuitStore((s) => s.logRelapse);
  const [trigger, setTrigger] = useState<CravingTrigger | null>(null);
  const [logged, setLogged] = useState(false);

  if (!plan) return null;

  const lifetimeDays = lifetimeVapeFreeDays(new Date(plan.originalQuitDate), relapses, new Date());

  function onConfirm() {
    if (!trigger) return;
    logRelapse(trigger);
    getAnalytics().capture(AnalyticsEvent.relapseLogged);
    setLogged(true);
  }

  if (logged && trigger) {
    return (
      <Screen scroll>
        <AppText variant="displayM" style={styles.headline}>
          Starting again, right now
        </AppText>
        <Card style={styles.tipCard}>
          <AppText variant="bodyStrong">Your adjusted plan</AppText>
          <AppText variant="body" color="textSecondary" style={styles.tipBody}>
            {planTipForTrigger(trigger)}
          </AppText>
        </Card>
        <Button label="Back to today" onPress={() => router.replace('/(app)/home')} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <AppText variant="displayM" style={styles.headline}>
        {RELAPSE_HEADLINE}
      </AppText>
      <AppText variant="bodyL" color="textSecondary" style={styles.body}>
        {relapseBody(lifetimeDays)}
      </AppText>

      <AppText variant="bodyStrong" style={styles.prompt}>
        What triggered it?
      </AppText>
      <View style={styles.options}>
        {TRIGGER_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            selected={trigger === opt.value}
            onPress={() => setTrigger(opt.value)}
          />
        ))}
      </View>

      <Button label="Continue" onPress={onConfirm} disabled={!trigger} style={styles.cta} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headline: { marginTop: spacing.xl, marginBottom: spacing.md },
  body: { marginBottom: spacing.xxl },
  prompt: { marginBottom: spacing.md },
  options: { gap: spacing.md },
  cta: { marginTop: spacing.xl },
  tipCard: { marginTop: spacing.xl, marginBottom: spacing.xl, gap: spacing.sm },
  tipBody: { marginTop: spacing.xs },
});
