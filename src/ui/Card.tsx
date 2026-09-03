/**
 * A glass pane floating on the sky.
 *
 * Translucent rather than opaque so the user's earned light stays visible behind every
 * surface — the progress signal is never covered up by content. Depth comes from a
 * top-edge highlight (light catching a raised edge) instead of a drop shadow, because
 * there is no opaque ground here for a shadow to fall on.
 */
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radii, shadow, spacing } from '@/theme';

type Tone = 'default' | 'reward' | 'care';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  /** Tints the edge only. Fills stay neutral so tone never shouts. */
  tone?: Tone;
}

const TONE_BORDER: Record<Tone, string> = {
  default: colors.border,
  reward: 'rgba(240, 178, 103, 0.28)',
  care: 'rgba(232, 160, 168, 0.28)',
};

export function Card({ children, style, padded = true, tone = 'default' }: CardProps) {
  return (
    <View
      style={[styles.card, { borderColor: TONE_BORDER[tone] }, padded && styles.padded, style]}
    >
      {/* Top-edge highlight — a 1px catch of light along the upper rim. */}
      <View style={styles.rim} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    ...shadow.card,
  },
  rim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  padded: {
    padding: spacing.xl,
  },
});
