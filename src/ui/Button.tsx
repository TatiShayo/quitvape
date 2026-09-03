/**
 * Button with a press-scale spring and optional haptic. Hit target >= 52px.
 *
 * Targets are oversized (52 rather than the 44 minimum) on purpose. Fine motor control
 * degrades under acute stress, and the moments this app most needs to succeed at are
 * exactly the stressed ones. A missed tap during a craving is a lost user.
 *
 * The `care` variant exists so "I slipped" can be a first-class, easy-to-press action
 * instead of a punitive one. If reporting a lapse is styled as a failure state, users
 * stop reporting lapses — and an unlogged relapse is invisible to the plan that is
 * supposed to adapt to it.
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

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'care' | 'reward';

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
      <AppText
        variant="bodyStrong"
        color={palette.text}
        style={leftIcon ? styles.labelGap : undefined}
      >
        {loading ? 'One moment…' : label}
      </AppText>
    </AnimatedPressable>
  );
}

const VARIANTS: Record<Variant, { bg: string; border: string; text: keyof typeof colors }> = {
  primary: { bg: colors.accent, border: colors.accent, text: 'textInverse' },
  secondary: { bg: colors.surfaceElevated, border: colors.borderStrong, text: 'textPrimary' },
  ghost: { bg: colors.transparent, border: colors.transparent, text: 'textSecondary' },
  /** Slips and hard moments — warm, soft, never accusatory. */
  care: { bg: 'rgba(232, 160, 168, 0.12)', border: 'rgba(232, 160, 168, 0.35)', text: 'care' },
  /** Reward CTAs — upgrade, claim a milestone. The only amber-filled control. */
  reward: { bg: colors.reward, border: colors.reward, text: 'textInverse' },
  /** Destructive only. Delete data, wipe account. Never the user's behaviour. */
  danger: { bg: colors.transparent, border: colors.dangerDim, text: 'danger' },
};

const styles = StyleSheet.create({
  base: {
    minHeight: HIT_TARGET + 8,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelGap: { marginLeft: spacing.sm },
  disabled: { opacity: 0.45 },
});
