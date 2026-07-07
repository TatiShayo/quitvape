import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  cancelAnimation,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, WhyIQuitReveal } from '@/ui';
import { colors, spacing } from '@/theme';
import { useQuitStore } from '@/store';
import { useNow } from '@/app-core/useNow';
import { AnalyticsEvent, getAnalytics } from '@/providers';
import { formatMoney, moneySaved } from '@/domain/money';
import { liveDuration } from '@/domain/streak';
import { QUIT_REASON_OPTIONS } from '@/content/quiz';

type Phase = 'inhale' | 'hold' | 'exhale';

// 4-7-8 rhythm (ms). The signature breathing interaction.
const PHASES: { phase: Phase; label: string; ms: number }[] = [
  { phase: 'inhale', label: 'Breathe in', ms: 4000 },
  { phase: 'hold', label: 'Hold', ms: 7000 },
  { phase: 'exhale', label: 'Breathe out', ms: 8000 },
];

// One full 4-7-8 cycle before revealing the user's "why I quit" words + actions
// (BUILD_PROMPT signature interaction: breathing first, then their reasons fade in).
const CYCLES_BEFORE_REVEAL = 2;

// Background "temperature" per phase (BUILD_PROMPT: "background gradient temperature
// shifting with each phase"). 0 = cool/deep (inhale — drawing in), 1 = warm (exhale —
// release). Hold sits at the midpoint. Interpolated continuously so the shift itself
// breathes rather than cutting between phases.
const TEMPERATURE_BY_PHASE: Record<Phase, number> = { inhale: 0, hold: 0.5, exhale: 1 };
const BG_COOL = '#0B1220';
const BG_MID = '#141225';
const BG_WARM = '#1F1420';

export default function Panic() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const plan = useQuitStore((s) => s.plan);
  const logCraving = useQuitStore((s) => s.logCraving);
  const now = useNow(1000);

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const scale = useSharedValue(0.6);
  const temperature = useSharedValue(TEMPERATURE_BY_PHASE.inhale);

  useEffect(() => {
    getAnalytics().capture(AnalyticsEvent.panicButtonOpened);
    return () => {
      cancelAnimation(scale);
      cancelAnimation(temperature);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on mount only
  }, []);

  useEffect(() => {
    if (revealed) return;
    const { phase, ms } = PHASES[phaseIndex];
    void Haptics.impactAsync(
      phase === 'exhale' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium,
    );
    const target = phase === 'inhale' ? 1 : phase === 'exhale' ? 0.6 : scale.value;
    scale.value = withTiming(
      target,
      { duration: ms, easing: Easing.inOut(Easing.ease) },
      (finished) => {
        if (!finished) return;
        const nextIndex = (phaseIndex + 1) % PHASES.length;
        if (nextIndex === 0) {
          const nextCycle = cycle + 1;
          if (nextCycle >= CYCLES_BEFORE_REVEAL) {
            runOnJS(setRevealed)(true);
            return;
          }
          runOnJS(setCycle)(nextCycle);
        }
        runOnJS(setPhaseIndex)(nextIndex);
      },
    );
    temperature.value = withTiming(TEMPERATURE_BY_PHASE[phase], {
      duration: ms,
      easing: Easing.inOut(Easing.ease),
    });
  }, [phaseIndex, cycle, revealed, scale, temperature]);

  const orbStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(temperature.value, [0, 0.5, 1], [BG_COOL, BG_MID, BG_WARM]),
  }));

  const saved = plan
    ? moneySaved(plan.vapeCostPerWeek, liveDuration(new Date(plan.streakStart), now).totalMs)
    : 0;
  const whyLabels = (plan?.reasons ?? [])
    .map((r) => QUIT_REASON_OPTIONS.find((opt) => opt.value === r)?.label)
    .filter((l): l is string => Boolean(l));

  function onResisted() {
    logCraving({ intensity: 3, trigger: 'other', resisted: true });
    getAnalytics().capture(AnalyticsEvent.cravingResisted);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  function onSlipped() {
    router.replace('/relapse');
  }

  return (
    <Animated.View
      style={[
        styles.container,
        backgroundStyle,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
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

      {!revealed ? (
        <View style={styles.orbWrap}>
          <Animated.View style={[styles.orb, orbStyle]} />
          <AppText variant="displayM" center style={styles.phaseLabel}>
            {PHASES[phaseIndex].label}
          </AppText>
        </View>
      ) : (
        <View style={styles.orbWrap}>
          <WhyIQuitReveal labels={whyLabels.length > 0 ? whyLabels : ['This craving will pass.']} />
        </View>
      )}

      {revealed ? (
        <>
          <View style={styles.why}>
            <AppText variant="caption" color="textTertiary" center>
              You&apos;ve saved
            </AppText>
            <AppText variant="displayM" color="money" tabular center>
              ${formatMoney(saved)}
            </AppText>
          </View>

          <View style={styles.actions}>
            <Button label="Craving passed" onPress={onResisted} haptic />
            <Button label="I slipped" onPress={onSlipped} variant="ghost" />
          </View>
        </>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  actions: { gap: spacing.md, paddingBottom: spacing.lg },
});
