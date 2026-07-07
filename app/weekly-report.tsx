/**
 * Weekly progress report (BUILD_PROMPT feature 13): the Sunday habit-anchor screen.
 * Cravings resisted, mood trend, and a streak share card. Reachable from Settings/Home;
 * a scheduled Sunday local notification (notifications engine) deep-links here.
 */
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Card, ShareCard, Screen } from '@/ui';
import { colors, spacing } from '@/theme';
import { useQuitStore } from '@/store';
import { useNow } from '@/app-core/useNow';
import { useShareCard } from '@/app-core/useShareCard';
import { buildWeeklyReport } from '@/domain/weeklyReport';
import { currentStreakDays, liveDuration, moneySaved } from '@/domain';

export default function WeeklyReport() {
  const plan = useQuitStore((s) => s.plan);
  const cravings = useQuitStore((s) => s.cravings);
  const checkIns = useQuitStore((s) => s.checkIns);
  const now = useNow(60_000);
  const cardRef = useRef<View>(null);
  const { share, sharing } = useShareCard(cardRef, 'weekly_report');

  if (!plan) return null;

  const report = buildWeeklyReport(cravings, checkIns, now);
  const streakDays = currentStreakDays(new Date(plan.streakStart), now);
  const saved = moneySaved(plan.vapeCostPerWeek, liveDuration(new Date(plan.streakStart), now).totalMs);

  return (
    <Screen scroll>
      <AppText variant="overline" color="accent">
        This week
      </AppText>
      <AppText variant="title" style={styles.title}>
        Your progress report
      </AppText>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <AppText variant="displayM" color="accent" tabular>
            {report.cravingsResisted}
          </AppText>
          <AppText variant="caption" color="textTertiary">
            Cravings resisted
          </AppText>
        </Card>
        <Card style={styles.statCard}>
          <AppText variant="displayM" color="money" tabular>
            ${moneySaved(plan.vapeCostPerWeek, 7 * 24 * 60 * 60 * 1000).toFixed(0)}
          </AppText>
          <AppText variant="caption" color="textTertiary">
            Saved this week
          </AppText>
        </Card>
      </View>

      <Card style={styles.moodCard}>
        <AppText variant="bodyStrong">Mood trend</AppText>
        {report.averageMood !== undefined ? (
          <>
            <View style={styles.moodRow}>
              {report.moodByDay.map((m, i) => (
                <View
                  key={report.days[i]}
                  style={[
                    styles.moodBar,
                    { height: m ? 12 + m * 8 : 4, backgroundColor: m ? colors.accent : colors.surfaceElevated },
                  ]}
                />
              ))}
            </View>
            <AppText variant="caption" color="textTertiary">
              {report.checkInCount} check-in{report.checkInCount === 1 ? '' : 's'} logged
            </AppText>
          </>
        ) : (
          <AppText variant="caption" color="textTertiary">
            No check-ins logged this week yet.
          </AppText>
        )}
      </Card>

      <View style={styles.shareSection}>
        <ShareCard
          ref={cardRef}
          kicker="QUITVAPE — WEEKLY"
          stat={String(streakDays)}
          statLabel="Days vape-free"
          footer={`$${saved.toFixed(0)} saved so far`}
        />
        <Button label={sharing ? 'Preparing…' : 'Share this week'} onPress={share} disabled={sharing} haptic style={styles.shareButton} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm, marginBottom: spacing.xl },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  statCard: { flex: 1, gap: spacing.xs },
  moodCard: { gap: spacing.md, marginBottom: spacing.xl },
  moodRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, height: 60 },
  moodBar: { flex: 1, borderRadius: 4 },
  shareSection: { alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl },
  shareButton: { width: 240 },
});
