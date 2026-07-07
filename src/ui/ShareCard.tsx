/**
 * Shareable achievement/report card (BUILD_PROMPT feature 8 + 13): "numbered metal
 * membership cards — dark, minimal, one huge stat" (BUILD_PROMPT art direction), sized
 * for IG story / TikTok (9:16). Captured via react-native-view-shot from a ref the
 * caller owns, so the same component renders on-screen and off-screen for capture.
 */
import { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, radii, spacing } from '@/theme';

interface ShareCardProps {
  /** Small top label, e.g. "QUITVAPE" or "WEEKLY REPORT". */
  kicker: string;
  /** The one huge stat, e.g. "7" or "$142". */
  stat: string;
  /** Unit under the stat, e.g. "DAYS VAPE-FREE". */
  statLabel: string;
  /** Small supporting line at the bottom. */
  footer?: string;
}

export const ShareCard = forwardRef<View, ShareCardProps>(function ShareCard(
  { kicker, stat, statLabel, footer },
  ref,
) {
  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <View style={styles.inner}>
        <AppText variant="overline" color="accent">
          {kicker}
        </AppText>
        <AppText variant="displayXL" color="textPrimary" tabular style={styles.stat}>
          {stat}
        </AppText>
        <AppText variant="label" color="textSecondary" style={styles.statLabel}>
          {statLabel}
        </AppText>
        <View style={styles.divider} />
        <AppText variant="caption" color="textTertiary">
          {footer ?? 'quitvape.app'}
        </AppText>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: 320,
    height: 568,
    backgroundColor: colors.bg,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  inner: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  stat: { marginTop: spacing.lg, fontSize: 72, lineHeight: 76 },
  statLabel: { letterSpacing: 2, textTransform: 'uppercase' },
  divider: {
    width: 40,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderStrong,
    marginVertical: spacing.xl,
  },
});
