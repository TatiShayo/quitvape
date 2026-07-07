/**
 * Primary/secondary/ghost button with a 0.97 press-scale spring and optional haptic
 * (PLAYBOOK 1.4: every tap gets a visible response within 100ms). Hit target >= 44px.
 */
import { ReactNode } from 'react';
import { AccessibilityRole, Pressable, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, HIT_TARGET, PRESS_SCALE, radii, spacing, spring } from '@/theme';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  haptic?: boolean;
  leftIcon?: ReactNode;
  style?: ViewStyle;
  accessibilityHint?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  haptic = false,
  leftIcon,
  style,
  accessibilityHint,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isDisabled = disabled || loading;
  const palette = VARIANTS[variant];

  return (
    <AnimatedPressable
      accessibilityRole={'button' as AccessibilityRole}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityHint={accessibilityHint}
      disabled={isDisabled}
      onPressIn={() => {
        scale.value = withSpring(PRESS_SCALE, spring.press);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, spring.press);
      }}
      onPress={() => {
        if (haptic) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={[
        styles.base,
        { backgroundColor: palette.bg, borderColor: palette.border },
        isDisabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {leftIcon}
      <AppText variant="bodyStrong" color={palette.text} style={leftIcon ? styles.labelGap : undefined}>
        {loading ? 'Please wait…' : label}
      </AppText>
    </AnimatedPressable>
  );
}

const VARIANTS: Record<Variant, { bg: string; border: string; text: keyof typeof colors }> = {
  primary: { bg: colors.accent, border: colors.accent, text: 'textInverse' },
  secondary: { bg: colors.surfaceElevated, border: colors.borderStrong, text: 'textPrimary' },
  ghost: { bg: colors.transparent, border: colors.transparent, text: 'textSecondary' },
  danger: { bg: colors.transparent, border: colors.dangerDim, text: 'danger' },
};

const styles = StyleSheet.create({
  base: {
    minHeight: HIT_TARGET + 4,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelGap: { marginLeft: spacing.sm },
  disabled: { opacity: 0.5 },
});
