/**
 * Circular progress ring to the next streak milestone. Liquid-smooth animated draw-in,
 * soft teal glow that intensifies as progress approaches 1 (BUILD_PROMPT: "soft teal
 * glow that intensifies near milestones").
 */
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface StreakRingProps {
  /** 0..1 progress toward the next milestone. */
  progress: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

export function StreakRing({ progress, size = 240, strokeWidth = 10, children }: StreakRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(clamped, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [clamped, animatedProgress]);

  const circleProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  // Glow intensifies as progress nears the milestone (BUILD_PROMPT signature detail).
  const glowOpacity = 0.25 + clamped * 0.55;
  const glowRadius = 12 + clamped * 24;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {/* Shadow lives on the wrapping View — react-native-svg elements don't accept
          RN shadow style props directly. */}
      <View
        style={[
          styles.glowWrap,
          {
            shadowColor: colors.accent,
            shadowOpacity: glowOpacity,
            shadowRadius: glowRadius,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.surfaceElevated}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.accent}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeLinecap="round"
            fill="none"
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
            animatedProps={circleProps}
          />
        </Svg>
      </View>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  glowWrap: { elevation: 10 },
  center: { position: 'absolute', alignItems: 'center' },
});
