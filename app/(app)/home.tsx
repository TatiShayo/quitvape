import { useCallback, useEffect, useMemo } from 'react';
import { AppState, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Wind, ChevronRight } from 'lucide-react-native';
import {
  AppText,
  Button,
  Card,
  CheckInPrompt,
  DayCounter,
  LungVisual,
  Stat,
  StatDivider,
  StatRow,
  Screen,
} from '@/ui';
import { colors, skyAt, skyProgress, spacing } from '@/theme';
import { useQuitStore, useSettingsStore } from '@/store';
import { useNow } from '@/app-core/useNow';
import { scheduleAllNotifications } from '@/app-core/notifications';
import { useReviewPrompt } from '@/app-core/useReviewPrompt';
import { useBuddy } from '@/app-core/useBuddy';
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
  const cravings = useQuitStore((s) => s.cravings);
  const notificationPrefs = useSettingsStore((s) => s.notifications);
  const now = useNow(1000);

  const todaysMood = useMemo(
    () => checkIns.find((c) => c.date === localDateKey(now))?.mood,
    [checkIns, now],
  );

  // Smart review prompt: fires exactly once at the 7-day streak (peak happiness),
  // never after a relapse/craving (0 when there's no plan yet). Mounted only here.
  const streakDaysForReview = plan ? currentStreakDays(new Date(plan.streakStart), now) : 0;
  useReviewPrompt(streakDaysForReview);

  // Accountability buddy (BUILD_PROMPT feature 12): "paired users see each other's
  // streak on home". Hook is safe to mount unconditionally (no-ops until an anon
  // session/backend is available).
  const { buddy } = useBuddy();

  const reschedule = useCallback(() => {
    if (!plan) return;
    const start = new Date(plan.streakStart);
    void scheduleAllNotifications({
      prefs: notificationPrefs,
      streakStart: start,
      streakDays: currentStreakDays(start, new Date()),
      cravings,
    });
  }, [plan, notificationPrefs, cravings]);

  // Reschedule notifications when the plan's streak start or craving log changes
  // (e.g. after onboarding, a relapse reset, or new danger-hour data) — not on every
  // per-second tick from useNow — AND whenever the app returns to the foreground, since
  // the OS can drop/expire scheduled locals while backgrounded and the danger-hour /
  // milestone math may have shifted across a day boundary since we last scheduled.
  useEffect(() => {
    reschedule();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') reschedule();
    });
    return () => sub.remove();
  }, [reschedule]);

  // Per-day derivations (milestone ladder + lung stage) only change when the calendar-day
  // count changes, so memoize them off `days` instead of recomputing on every 1s useNow
  // tick. The live counter (liveDuration/moneySaved below) intentionally stays per-tick.
  const dayCount = plan ? currentStreakDays(new Date(plan.streakStart), now) : 0;
  const milestone = useMemo(() => milestoneProgress(dayCount), [dayCount]);
  const stage = useMemo(() => lungStage(dayCount), [dayCount]);

  // The sky lightens with the streak. Computed here and passed down so the whole screen
  // sits in an atmosphere the user earned rather than a fixed background.
  const sky = useMemo(() => skyAt(skyProgress(dayCount)), [dayCount]);

  if (!plan) {
    return (
      <Screen>
        <AppText variant="title">Setting up your plan…</AppText>
      </Screen>
    );
  }

  const start = new Date(plan.streakStart);
  const live = liveDuration(start, now);
  const days = dayCount;
  const saved = moneySaved(plan.vapeCostPerWeek, live.totalMs);
  const taper =
    plan.method === 'taper'
      ? taperStatus(plan.baselinePuffsPerDay, start, now, puffsToday(now))
      : null;

  return (
    <Screen scroll sky={sky}>
      <DayCounter
        days={live.days}
        hours={live.hours}
        minutes={live.minutes}
        seconds={live.seconds}
        milestoneProgress={milestone.progress}
        nextMilestone={milestone.next ?? null}
      />

      {/* Panic is the highest-stakes action in the app and it sits above the fold,
          reachable with a thumb. Everything else can be scrolled to. */}
      <Button
        label="I need help right now"
        onPress={() => router.push('/panic')}
        haptic
        leftIcon={<Wind color={colors.textInverse} size={20} />}
        accessibilityHint="Opens a guided breathing exercise to ride out a craving"
        style={styles.panic}
      />

      <Card tone="reward" style={styles.block}>
        <StatRow>
          <Stat
            label="Kept in your pocket"
            value={`$${formatMoney(saved)}`}
            tone="reward"
            size="lg"
            footnote="since you started"
          />
        </StatRow>
      </Card>

      {taper ? (
        <Card style={styles.block}>
          <StatRow>
            <Stat
              label={`Week ${taper.weekIndex + 1} allowance`}
              value={`${taper.remaining}/${taper.allowance}`}
              tone={taper.overLimit ? 'care' : 'accent'}
              footnote={taper.overLimit ? 'over for today — tomorrow resets' : 'left for today'}
            />
          </StatRow>
          {taper.readyToQuit ? (
            <AppText variant="caption" color="accent" style={styles.taperNote}>
              You&apos;re down to a small allowance. Ready to go all the way?
            </AppText>
          ) : null}
          <Button
            label="Log a puff"
            variant="secondary"
            onPress={() => logPuff(now)}
            style={styles.taperButton}
          />
        </Card>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open health timeline"
        onPress={() => router.push('/(app)/health')}
      >
        <Card style={styles.block}>
          <View style={styles.lungRow}>
            <LungVisual stage={stage} size={96} />
            <View style={styles.lungCopy}>
              <AppText variant="overline" color="textTertiary">
                Recovering
              </AppText>
              <AppText variant="bodyStrong">Your lungs are clearing</AppText>
              <AppText variant="caption" color="textTertiary">
                See what has already changed inside your body
              </AppText>
            </View>
            <ChevronRight color={colors.textTertiary} size={18} />
          </View>
        </Card>
      </Pressable>

      {buddy?.paired ? (
        <Card style={styles.block}>
          <StatRow>
            <Stat label="You" value={`${days}d`} tone="accent" />
            <StatDivider />
            <Stat label="Your buddy" value={`${buddy.buddyStreakDays ?? 0}d`} />
          </StatRow>
        </Card>
      ) : null}

      <CheckInPrompt
        todaysMood={todaysMood}
        onSubmit={(mood) => {
          submitCheckIn(mood, now);
          getAnalytics().capture(AnalyticsEvent.checkInSubmitted);
        }}
      />

      <View style={styles.secondary}>
        <Button
          label="Achievements"
          onPress={() => router.push('/achievements')}
          variant="secondary"
        />
        <Button
          label={buddy?.paired ? 'Your buddy' : 'Invite a buddy'}
          onPress={() => router.push('/buddy')}
          variant="secondary"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  panic: { marginBottom: spacing.xxl },
  block: { marginBottom: spacing.lg },
  lungRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  lungCopy: { flex: 1, gap: spacing.xs },
  taperNote: { marginTop: spacing.md },
  taperButton: { marginTop: spacing.lg },
  secondary: { gap: spacing.md, marginTop: spacing.xl },
});
