import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
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
import { AppText, Button, Sky, WhyIQuitReveal } from '@/ui';
import { colors, PANIC_SKY, spacing } from '@/theme';
import { useQuitStore } from '@/store';
import { useNow } from '@/app-core/useNow';
import { useHotline } from '@/app-core/useHotline';
import { AnalyticsEvent, getAnalytics } from '@/providers';
import { formatMoney, moneySaved } from '@/domain/money';
import { liveDuration } from '@/domain/streak';
import { QUIT_REASON_OPTIONS } from '@/content/quiz';

/**
 * PANIC MODE — the screen that has to work when nothing else does.
 *
 * DESIGN CONSTRAINTS, ALL BEHAVIOURAL:
 *
 * 1. NO ALARM COLOUR. The instinct is to make an emergency screen red. That is exactly
 *    backwards. A craving is already a sympathetic-arousal spike; long-wavelength,
 *    high-saturation colour raises arousal further (Valdez & Mehrabian). This screen
 *    steps *away* from the user's warm earned sky into a cool, desaturated field —
 *    the palette does the opposite of what the body is doing.
 *
 * 2. THE WAVE IS NAMED AND TIMED. Cravings peak and subside in roughly 3-5 minutes,
 *    but subjectively feel unbounded. Urge-surfing (Marlatt's relapse-prevention work)
 *    depends on the user believing the thing is finite. The 4-7-8 cycle is a container
 *    with a visible end, and the copy says outright that it passes.
 *
 * 3. BREATHING FIRST, REASONS SECOND. The 4-7-8 pattern lengthens exhale relative to
 *    inhale, which raises vagal tone and drops heart rate — a physiological intervention
 *    that works whether or not the user is convinced by it. Only once arousal has come
 *    down are their own stated reasons surfaced, because reason-giving requires the
 *    prefrontal capacity that the first sixty seconds are spent restoring.
 *
 * 4. "I SLIPPED" IS NOT PUNISHED. It is styled in the care tone, same weight as the
 *    other exit. A slip route that looks like a failure button gets avoided, and an
 *    unlogged slip is one the plan cannot adapt to.
 */

type Phase = 'inhale' | 'hold' | 'exhale';

// 4-7-8 rhythm (ms). Extended exhale is the active ingredient, not the inhale.
const PHASES: { phase: Phase; label: string; hint: string; ms: number }[] = [
  { phase: 'inhale', label: 'Breathe in', hint: 'through your nose', ms: 4000 },
  { phase: 'hold', label: 'Hold', hint: 'stay with it', ms: 7000 },
  { phase: 'exhale', label: 'Breathe out', hint: 'slowly, through your mouth', ms: 8000 },
];

// Two full cycles (~38s) before revealing their "why". Long enough for the arousal
// curve to turn, short enough that it never feels like being held hostage.
const CYCLES_BEFORE_REVEAL = 2;

export default function Panic() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const plan = useQuitStore((s) => s.plan);
  const logCraving = useQuitStore((s) => s.logCraving);
  const now = useNow(1000);
  const hotline = useHotline();

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const scale = useSharedValue(0.62);
  const halo = useSharedValue(0.3);

  useEffect(() => {
    getAnalytics().capture(AnalyticsEvent.panicButtonOpened);
    return () => {
      cancelAnimation(scale);
      cancelAnimation(halo);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on mount only
  }, []);

  useEffect(() => {
    if (revealed) return;
    const { phase, ms } = PHASES[phaseIndex];
    // Haptic marks each phase change so the rhythm can be followed with eyes closed —
    // which is what people actually do, and what we want them to do.
    void Haptics.impactAsync(
      phase === 'exhale' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium,
    );
    const target = phase === 'inhale' ? 1 : phase === 'exhale' ? 0.62 : scale.value;
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
    halo.value = withTiming(phase === 'inhale' ? 0.85 : phase === 'exhale' ? 0.25 : 0.55, {
      duration: ms,
      easing: Easing.inOut(Easing.ease),
    });
  }, [phaseIndex, cycle, revealed, scale, halo]);

  const orbStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: halo.value * 0.5,
    transform: [{ scale: 1 + halo.value * 0.35 }],
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

  const current = PHASES[phaseIndex];
  const cycleLabel = `Round ${cycle + 1} of ${CYCLES_BEFORE_REVEAL}`;

  return (
    <View style={styles.container}>
      {/* Cool, starless field — deliberately not the user's earned sky. */}
      <Sky stops={PANIC_SKY} starless />

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <View style={styles.topBar}>
          <AppText variant="overline" color="textTertiary">
            {revealed ? 'Why you started' : cycleLabel}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close panic mode"
            onPress={() => router.back()}
            hitSlop={16}
            style={styles.close}
          >
            <AppText variant="label" color="textSecondary">
              Close
            </AppText>
          </Pressable>
        </View>

        {!revealed ? (
          <>
            <View style={styles.orbWrap}>
              <Animated.View style={[styles.halo, haloStyle]} />
              <Animated.View style={[styles.orb, orbStyle]} />
              <View style={styles.phaseText}>
                <AppText variant="displayM" center>
                  {current.label}
                </AppText>
                <AppText variant="caption" color="textSecondary" center style={styles.hint}>
                  {current.hint}
                </AppText>
              </View>
            </View>

            {/* The single most important sentence on this screen. */}
            <AppText variant="bodyL" color="textSecondary" center style={styles.reassure}>
              This wave peaks in about three minutes, then it goes.{'\n'}You do not have to
              do anything but breathe.
            </AppText>
          </>
        ) : (
          <>
            <View style={styles.orbWrap}>
              <WhyIQuitReveal
                labels={whyLabels.length > 0 ? whyLabels : ['This craving will pass.']}
              />
            </View>

            <View style={styles.savedBlock}>
              <AppText variant="overline" color="textTertiary" center>
                Still yours
              </AppText>
              <AppText variant="displayL" color="money" tabular center>
                ${formatMoney(saved)}
              </AppText>
            </View>

            <View style={styles.actions}>
              <Button label="It passed" onPress={onResisted} haptic />
              <Button label="I slipped — that's okay" onPress={onSlipped} variant="care" />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Call ${hotline.name} at ${hotline.phone}`}
                onPress={() => void Linking.openURL(hotline.tel)}
                hitSlop={12}
                style={styles.hotlineLink}
              >
                <AppText variant="caption" color="textTertiary" center>
                  Want a human instead? Call {hotline.phone}
                </AppText>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const ORB = 200;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  close: { paddingVertical: spacing.sm, paddingLeft: spacing.lg },
  orbWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  halo: {
    position: 'absolute',
    width: ORB,
    height: ORB,
    borderRadius: ORB / 2,
    backgroundColor: colors.accent,
  },
  orb: {
    position: 'absolute',
    width: ORB,
    height: ORB,
    borderRadius: ORB / 2,
    borderWidth: 1,
    borderColor: 'rgba(155, 164, 240, 0.45)',
    backgroundColor: 'rgba(155, 164, 240, 0.10)',
  },
  phaseText: { alignItems: 'center' },
  hint: { marginTop: spacing.xs },
  reassure: { marginBottom: spacing.xxl },
  savedBlock: { gap: spacing.xs, marginBottom: spacing.xl },
  actions: { gap: spacing.md, paddingBottom: spacing.sm },
  hotlineLink: { paddingVertical: spacing.sm },
});
