/**
 * The home hero — replaces the progress ring.
 *
 * WHY NOT A RING
 * A ring encodes progress as angle/area, the least accurately-read channel in the
 * Cleveland & McGill hierarchy, and it is the single most copied form in the category
 * (every fitness and habit app ships one). Here the milestone bar is a straight rule:
 * position along a common scale, the most accurately-read channel there is. The number
 * itself carries the emotional weight; the rule carries the arithmetic.
 *
 * WHY DISTANCE-TO-NEXT AND NOT TOTAL
 * Goal-gradient effect (Hull; Kivetz et al.): effort accelerates as a goal nears. Showing
 * "4 days to 30" is motivating in a way "26 days done" is not — the same fact, framed
 * against the near edge instead of the far one.
 *
 * WHY THE SECONDS TICK
 * Loss aversion. A streak that visibly accrues, second by second, is felt as a holding
 * with value — and losses loom roughly twice as large as equivalent gains. The live
 * timer is not a clock, it is a balance the user does not want to give up.
 */
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, duration, radii, spacing } from '@/theme';
import { AppText } from './AppText';

interface DayCounterProps {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** 0..1 toward the next milestone. */
  milestoneProgress: number;
  /** The milestone being approached, or null once every one is cleared. */
  nextMilestone: number | null;
}

export function DayCounter({
  days,
  hours,
  minutes,
  seconds,
  milestoneProgress,
  nextMilestone,
}: DayCounterProps) {
  const rise = useSharedValue(0);
  const fill = useSharedValue(0);

  useEffect(() => {
    rise.value = withTiming(1, { duration: duration.slow, easing: Easing.out(Easing.cubic) });
    fill.value = withDelay(
      duration.base,
      withTiming(milestoneProgress, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );
  }, [milestoneProgress, rise, fill]);

  const riseStyle = useAnimatedStyle(() => ({
    opacity: rise.value,
    transform: [{ translateY: (1 - rise.value) * 14 }],
  }));
  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(1, fill.value)) * 100}%`,
  }));

  const remaining = nextMilestone === null ? 0 : Math.max(0, nextMilestone - days);
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <Animated.View style={[styles.wrap, riseStyle]}>
      <AppText variant="overline" color="textTertiary">
        Vape-free
      </AppText>

      <View style={styles.numeralRow}>
        <AppText variant="displayXXL" tabular accessibilityLabel={`${days} days vape free`}>
          {days}
        </AppText>
        <AppText variant="title" color="textTertiary" style={styles.unit}>
          {days === 1 ? 'day' : 'days'}
        </AppText>
      </View>

      <AppText variant="label" color="textSecondary" tabular style={styles.clock}>
        {pad(hours)}:{pad(minutes)}:{pad(seconds)} and counting
      </AppText>

      {/* Milestone rule — position on a common scale, not an arc. */}
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>

      <AppText variant="caption" color="textTertiary" style={styles.caption}>
        {nextMilestone === null
          ? 'Every milestone behind you. You are the proof now.'
          : `${remaining} ${remaining === 1 ? 'day' : 'days'} to ${nextMilestone}`}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, marginTop: spacing.xl, marginBottom: spacing.xxl },
  numeralRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  unit: { paddingBottom: spacing.sm },
  clock: { marginTop: spacing.xs },
  track: {
    height: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  fill: { height: 3, borderRadius: radii.pill, backgroundColor: colors.accent },
  caption: { marginTop: spacing.sm },
});
