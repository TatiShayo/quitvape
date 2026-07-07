/** Thin animated progress bar for the onboarding quiz header. */
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors, duration, radii } from '@/theme';

interface QuizProgressProps {
  /** 0..1 */
  progress: number;
}

export function QuizProgress({ progress }: QuizProgressProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  const style = useAnimatedStyle(() => ({
    width: `${withTiming(clamped * 100, { duration: duration.base })}%`,
  }));

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
});
