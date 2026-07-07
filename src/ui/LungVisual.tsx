/**
 * Lung line-art SVG that clears/brightens through staged states (day 0/1/3/7/14/30/90)
 * with a crossfade morph between stages (BUILD_PROMPT: "elegant line-art... anatomical-
 * beautiful, not cartoonish"). A single path pair (line-art outline + haze overlay) is
 * reused across stages; only stroke opacity/color and haze opacity animate, so the
 * "organ" never looks like a sticker swap.
 */
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { colors, duration } from '@/theme';
import { LungStage } from '@/domain/streak';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface LungVisualProps {
  stage: LungStage;
  size?: number;
}

/** Haze (congestion) opacity per stage — clears as the streak grows. */
const HAZE_BY_STAGE: Record<LungStage, number> = {
  0: 0.85,
  1: 0.7,
  3: 0.55,
  7: 0.4,
  14: 0.25,
  30: 0.12,
  90: 0,
};

/** Line-art stroke color warms from a dim ash tone to the full accent as lungs clear. */
const STROKE_BY_STAGE: Record<LungStage, string> = {
  0: colors.textTertiary,
  1: colors.textTertiary,
  3: colors.textSecondary,
  7: colors.textSecondary,
  14: colors.accentDim,
  30: colors.accent,
  90: colors.accent,
};

// Simplified anatomical line-art: trachea + two lobed bronchial trees.
const LUNGS_PATH =
  'M60 8 L60 30 M60 30 C40 34 24 40 20 58 C16 78 24 96 40 104 C48 108 56 104 58 92 L60 30 M60 30 C80 34 96 40 100 58 C104 78 96 96 80 104 C72 108 64 104 62 92 L60 30';

const HAZE_PATH =
  'M22 60 C18 78 26 94 40 100 C48 104 54 100 56 90 L58 40 M62 40 L64 90 C66 100 72 104 80 100 C94 94 102 78 98 60';

export function LungVisual({ stage, size = 160 }: LungVisualProps) {
  const hazeOpacity = useSharedValue(HAZE_BY_STAGE[stage]);

  useEffect(() => {
    hazeOpacity.value = withTiming(HAZE_BY_STAGE[stage], {
      duration: duration.slow * 2,
      easing: Easing.inOut(Easing.ease),
    });
  }, [stage, hazeOpacity]);

  const hazeProps = useAnimatedProps(() => ({ opacity: hazeOpacity.value }));

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Path
          d={LUNGS_PATH}
          stroke={STROKE_BY_STAGE[stage]}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
        />
        <AnimatedPath
          d={HAZE_PATH}
          stroke={colors.textTertiary}
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          animatedProps={hazeProps}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
