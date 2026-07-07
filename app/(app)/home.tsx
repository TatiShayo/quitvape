import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Wind } from 'lucide-react-native';
import { AppText, Button, Card, Screen } from '@/ui';
import { colors, spacing } from '@/theme';
import { useQuitStore } from '@/store';
import { useNow } from '@/app-core/useNow';
import { currentStreakDays, liveDuration, milestoneProgress } from '@/domain/streak';
import { formatMoney, moneySaved } from '@/domain/money';

export default function Home() {
  const router = useRouter();
  const plan = useQuitStore((s) => s.plan);
  const now = useNow(1000);

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

  return (
    <Screen scroll>
      <AppText variant="overline" color="accent">
        Vape-free streak
      </AppText>

      <View style={styles.counter}>
        <AppText variant="displayXL" tabular>
          {live.days}
          <AppText variant="displayM" color="textTertiary">d </AppText>
          {String(live.hours).padStart(2, '0')}
          <AppText variant="displayM" color="textTertiary">h </AppText>
          {String(live.minutes).padStart(2, '0')}
          <AppText variant="displayM" color="textTertiary">m</AppText>
        </AppText>
      </View>

      {milestone.next ? (
        <AppText variant="caption" color="textSecondary" style={styles.milestone}>
          {milestone.next - days} day{milestone.next - days === 1 ? '' : 's'} to your{' '}
          {milestone.next}-day milestone
        </AppText>
      ) : (
        <AppText variant="caption" color="textSecondary" style={styles.milestone}>
          Every milestone cleared. You are the proof.
        </AppText>
      )}

      <Card style={styles.moneyCard}>
        <AppText variant="caption" color="textTertiary">
          Money saved
        </AppText>
        <AppText variant="displayL" color="money" tabular>
          ${formatMoney(saved)}
        </AppText>
      </Card>

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
  counter: { marginTop: spacing.lg, marginBottom: spacing.sm },
  milestone: { marginBottom: spacing.xl },
  moneyCard: { marginBottom: spacing.xxl },
  panic: {},
});
