import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button } from '@/ui';
import { colors, spacing } from '@/theme';
import { useQuitStore } from '@/store';
import { useNow } from '@/app-core/useNow';
import { AnalyticsEvent, getAnalytics } from '@/providers';
import { formatMoney, moneySaved } from '@/domain/money';
import { liveDuration } from '@/domain/streak';

type Phase = 'inhale' | 'hold' | 'exhale';

// 4-7-8 rhythm (ms). The signature breathing interaction.
const PHASES: { phase: Phase; label: string; ms: number }[] = [
  { phase: 'inhale', label: 'Breathe in', ms: 4000 },
  { phase: 'hold', label: 'Hold', ms: 7000 },
  { phase: 'exhale', label: 'Breathe out', ms: 8000 },
];

export default function Panic() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const plan = useQuitStore((s) => s.plan);
  const logCraving = useQuitStore((s) => s.logCraving);
  const logRelapse = useQuitStore((s) => s.logRelapse);
  const now = useNow(1000);

  const [phaseIndex, setPhaseIndex] = useState(0);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    getAnalytics().capture(AnalyticsEvent.panicButtonOpened);
    return () => cancelAnimation(scale);
  }, [scale]);

  useEffect(() => {
    const { phase, ms } = PHASES[phaseIndex];
    void Haptics.impactAsync(
      phase === 'exhale' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium,
    );
    const target = phase === 'inhale' ? 1 : phase === 'exhale' ? 0.6 : scale.value;
    scale.value = withTiming(
      target,
      { duration: ms, easing: Easing.inOut(Easing.ease) },
      (finished) => {
        if (finished) runOnJS(setPhaseIndex)((phaseIndex + 1) % PHASES.length);
      },
    );
  }, [phaseIndex, scale]);

  const orbStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const saved = plan
    ? moneySaved(plan.vapeCostPerWeek, liveDuration(new Date(plan.streakStart), now).totalMs)
    : 0;

  function onResisted() {
    logCraving({ intensity: 4, trigger: 'other', resisted: true });
    getAnalytics().capture(AnalyticsEvent.cravingResisted);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  function onSlipped() {
    logCraving({ intensity: 5, trigger: 'other', resisted: false });
    logRelapse('other');
    getAnalytics().capture(AnalyticsEvent.relapseLogged);
    router.back();
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close panic mode"
        onPress={() => router.back()}
        style={styles.close}
        hitSlop={12}
      >
        <AppText variant="body" color="textTertiary">
          Close
        </AppText>
      </Pressable>

      <View style={styles.orbWrap}>
        <Animated.View style={[styles.orb, orbStyle]} />
        <AppText variant="displayM" center style={styles.phaseLabel}>
          {PHASES[phaseIndex].label}
        </AppText>
      </View>

      <View style={styles.why}>
        <AppText variant="caption" color="textTertiary" center>
          You've saved
        </AppText>
        <AppText variant="displayM" color="money" tabular center>
          ${formatMoney(saved)}
        </AppText>
        <AppText variant="body" color="textSecondary" center style={styles.reason}>
          This craving will pass. It always does.
        </AppText>
      </View>

      <View style={styles.actions}>
        <Button label="Craving passed" onPress={onResisted} haptic />
        <Button label="I slipped" onPress={onSlipped} variant="ghost" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  close: { alignSelf: 'flex-end', paddingVertical: spacing.md },
  orbWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orb: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.accent,
    opacity: 0.85,
    shadowColor: colors.accent,
    shadowOpacity: 0.7,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  phaseLabel: { position: 'absolute' },
  why: { gap: spacing.xs, marginBottom: spacing.xl },
  reason: { marginTop: spacing.sm },
  actions: { gap: spacing.md, paddingBottom: spacing.lg },
});
