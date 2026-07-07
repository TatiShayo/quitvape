/**
 * Animated semicircular gauge (0-10 scale) for the dependency score reveal. SVG arc
 * with a stroke-dashoffset draw-in animation on mount (PLAYBOOK 1.4: "progress rings
 * draw in"). Color ramps from accent (low) to danger (severe) via the band.
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
import { colors, duration } from '@/theme';
import { AppText } from './AppText';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface GaugeProps {
  /** 0-10 score. */
  value: number;
  size?: number;
  bandColor: string;
}

export function Gauge({ value, size = 220, bandColor }: GaugeProps) {
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // half-circle arc length
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.min(1, Math.max(0, value / 10)), {
      duration: duration.slow * 2,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={[styles.wrap, { width: size, height: size / 2 + strokeWidth }]}>
      <Svg width={size} height={size / 2 + strokeWidth} viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceElevated}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference * 2}`}
          strokeLinecap="round"
          fill="none"
          rotation={180}
          origin={`${size / 2}, ${size / 2}`}
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bandColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference * 2}`}
          strokeLinecap="round"
          fill="none"
          rotation={180}
          origin={`${size / 2}, ${size / 2}`}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={styles.label}>
        <AppText variant="displayXL" tabular center>
          {value.toFixed(1)}
        </AppText>
        <AppText variant="caption" color="textTertiary" center>
          out of 10
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'flex-end' },
  label: { position: 'absolute', bottom: 0, alignItems: 'center' },
});
