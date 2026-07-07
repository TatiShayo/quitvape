import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Wind } from 'lucide-react-native';
import { AppText, Button, Card, CheckInPrompt, LungVisual, StreakRing, Screen } from '@/ui';
import { colors, spacing } from '@/theme';
import { useQuitStore } from '@/store';
import { useNow } from '@/app-core/useNow';
import { currentStreakDays, liveDuration, lungStage, milestoneProgress } from '@/domain/streak';
import { formatMoney, moneySaved } from '@/domain/money';
import { taperStatus } from '@/domain/taper';
import { localDateKey } from '@/domain/time';
import { AnalyticsEvent, getAnalytics } from '@/providers';

export default function Home() {
  const router = useRouter();
  const plan = useQuitStore((s) => s.plan);
  const checkIns = useQuitStore((s) => s.checkIns);
  const submitCheckIn = useQuitStore((s) => s.submitCheckIn);
  const puffsToday = useQuitStore((s) => s.puffsToday);
  const logPuff = useQuitStore((s) => s.logPuff);
  const now = useNow(1000);

  const todaysMood = useMemo(
    () => checkIns.find((c) => c.date === localDateKey(now))?.mood,
    [checkIns, now],
  );

  if (!plan) {
    return (
      <Screen>
        <AppText variant="title">Setting up your plan…</AppText>
      </Screen>
    );
  }

  const start = new Date(plan.streakStart);
  const live = liveDuration(start, now);
  const days = currentStreakDays(start, now);
  const milestone = milestoneProgress(days);
  const saved = moneySaved(plan.vapeCostPerWeek, live.totalMs);
  const stage = lungStage(days);
  const taper = plan.method === 'taper' ? taperStatus(plan.baselinePuffsPerDay, start, now, puffsToday(now)) : null;

  return (
    <Screen scroll>
      <AppText variant="overline" color="accent">
        {plan.method === 'taper' ? 'Taper plan' : 'Vape-free streak'}
      </AppText>

      <View style={styles.ringWrap}>
        <StreakRing progress={milestone.progress}>
          <AppText variant="displayXL" tabular center>
            {live.days}
          </AppText>
          <AppText variant="caption" color="textTertiary" center>
            day{live.days === 1 ? '' : 's'}
          </AppText>
          <AppText variant="caption" color="textSecondary" tabular center style={styles.hms}>
            {String(live.hours).padStart(2, '0')}:{String(live.minutes).padStart(2, '0')}:
            {String(live.seconds).padStart(2, '0')}
          </AppText>
        </StreakRing>
      </View>

      {milestone.next ? (
        <AppText variant="caption" color="textSecondary" center style={styles.milestone}>
          {milestone.next - days} day{milestone.next - days === 1 ? '' : 's'} to your{' '}
          {milestone.next}-day milestone
        </AppText>
      ) : (
        <AppText variant="caption" color="textSecondary" center style={styles.milestone}>
          Every milestone cleared. You are the proof.
        </AppText>
      )}

      <View style={styles.lungRow}>
        <LungVisual stage={stage} size={120} />
        <View style={styles.lungCopy}>
          <AppText variant="bodyStrong">Your lungs are healing</AppText>
          <AppText variant="caption" color="textTertiary">
            Visual clears as your streak grows — see the full timeline in Health.
          </AppText>
        </View>
      </View>

      <Card style={styles.moneyCard}>
        <AppText variant="caption" color="textTertiary">
          Money saved
        </AppText>
        <AppText variant="displayL" color="money" tabular>
          ${formatMoney(saved)}
        </AppText>
      </Card>

      {taper ? (
        <Card style={styles.taperCard}>
          <AppText variant="caption" color="textTertiary">
            Today&apos;s allowance (week {taper.weekIndex + 1})
          </AppText>
          <AppText variant="displayM" color={taper.overLimit ? 'danger' : 'accent'} tabular>
            {taper.remaining} / {taper.allowance}
          </AppText>
          {taper.readyToQuit ? (
            <AppText variant="caption" color="success">
              You&apos;re down to a small allowance — ready to go all the way?
            </AppText>
          ) : null}
          <Button
            label="Log a puff"
            variant="secondary"
            onPress={() => logPuff(now)}
            style={styles.logPuffButton}
          />
        </Card>
      ) : null}

      <CheckInPrompt
        todaysMood={todaysMood}
        onSubmit={(mood) => {
          submitCheckIn(mood, now);
          getAnalytics().capture(AnalyticsEvent.checkInSubmitted);
        }}
      />

      <Button
        label="Panic button"
        onPress={() => router.push('/panic')}
        haptic
        leftIcon={<Wind color={colors.textInverse} size={20} />}
        style={styles.panic}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  ringWrap: { alignItems: 'center', marginTop: spacing.lg },
  hms: { marginTop: spacing.xs },
  milestone: { marginTop: spacing.md, marginBottom: spacing.xl },
  lungRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl },
  lungCopy: { flex: 1, gap: spacing.xs },
  moneyCard: { marginBottom: spacing.lg },
  taperCard: { marginBottom: spacing.lg, gap: spacing.sm },
  logPuffButton: { marginTop: spacing.sm },
  panic: { marginTop: spacing.xl, marginBottom: spacing.md },
});
