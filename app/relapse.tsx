import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Card, OptionCard, Screen, Stat, StatRow } from '@/ui';
import { skyAt, spacing } from '@/theme';
import { useQuitStore } from '@/store';
import { CravingTrigger } from '@/domain/types';
import { lifetimeVapeFreeDays } from '@/domain/streak';
import { RELAPSE_HEADLINE, TRIGGER_OPTIONS, planTipForTrigger, relapseBody } from '@/content/relapse';
import { AnalyticsEvent, getAnalytics } from '@/providers';

/**
 * RELAPSE — the screen that decides whether the user stays or uninstalls.
 *
 * WHY THERE IS NO RED, NO WARNING ICON, NO "STREAK LOST" BANNER
 * Shame is the strongest predictor of abandonment after a lapse. The abstinence
 * violation effect (Marlatt & Gordon) describes exactly this: a single slip gets
 * reframed by the user as proof the whole attempt has failed, and that reframe — not
 * the nicotine — is what turns a lapse into a full relapse. An interface that confirms
 * the reframe is actively harmful. So this screen is styled as a log entry, not a
 * verdict.
 *
 * WHY THE SKY DOES NOT GO BACK TO BLACK
 * The sky steps back partway, never to night. Lifetime vape-free days keep counting and
 * are shown before anything else, because the true, defensible fact after a slip is that
 * the vast majority of the progress is still there. Resetting the visual to zero would
 * be both demoralising and, strictly, a lie about what happened.
 *
 * WHY IT ASKS FOR A TRIGGER
 * It converts a moment of self-blame into a moment of data collection. Attributing the
 * lapse to a situation ("I was drinking", "I was stressed") rather than to character is
 * the reattribution move at the centre of relapse-prevention therapy — and it is the
 * only input that lets the plan actually adapt.
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

  // A held, low sky — dusk rather than midnight. The user did not lose everything and
  // the canvas should not claim they did.
  const sky = skyAt(0.22);

  function onConfirm() {
    if (!trigger) return;
    logRelapse(trigger);
    getAnalytics().capture(AnalyticsEvent.relapseLogged);
    setLogged(true);
  }

  if (logged && trigger) {
    return (
      <Screen scroll sky={sky}>
        <AppText variant="overline" color="textTertiary" style={styles.eyebrow}>
          Logged
        </AppText>
        <AppText variant="displayM" style={styles.headline}>
          Starting again, right now
        </AppText>
        <AppText variant="bodyL" color="textSecondary" style={styles.body}>
          Nothing about the last {lifetimeDays} days stopped being true.
        </AppText>

        <Card tone="care" style={styles.tipCard}>
          <AppText variant="overline" color="textTertiary">
            What changes in your plan
          </AppText>
          <AppText variant="body" color="textSecondary" style={styles.tipBody}>
            {planTipForTrigger(trigger)}
          </AppText>
        </Card>

        <Button label="Back to today" onPress={() => router.replace('/(app)/home')} />
      </Screen>
    );
  }

  return (
    <Screen scroll sky={sky}>
      <AppText variant="displayM" style={styles.headline}>
        {RELAPSE_HEADLINE}
      </AppText>
      <AppText variant="bodyL" color="textSecondary" style={styles.body}>
        {relapseBody(lifetimeDays)}
      </AppText>

      {/* Shown before the trigger question on purpose: establish what is still standing
          before asking the user to look at what went wrong. */}
      <Card style={styles.ledger}>
        <StatRow>
          <Stat
            label="Vape-free, all time"
            value={`${lifetimeDays}`}
            tone="accent"
            footnote={lifetimeDays === 1 ? 'day, still counting' : 'days, still counting'}
          />
        </StatRow>
      </Card>

      <AppText variant="bodyStrong" style={styles.prompt}>
        What was going on?
      </AppText>
      <AppText variant="caption" color="textTertiary" style={styles.promptSub}>
        Not to judge it — this is what teaches your plan where the hard spots are.
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
  eyebrow: { marginTop: spacing.lg },
  headline: { marginTop: spacing.md, marginBottom: spacing.md },
  body: { marginBottom: spacing.xl },
  ledger: { marginBottom: spacing.xxl },
  prompt: { marginBottom: spacing.xs },
  promptSub: { marginBottom: spacing.lg },
  options: { gap: spacing.md },
  cta: { marginTop: spacing.xl },
  tipCard: { marginBottom: spacing.xl, gap: spacing.sm },
  tipBody: { marginTop: spacing.xs },
});
