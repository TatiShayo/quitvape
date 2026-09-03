/**
 * A single labelled figure, and a row that groups several.
 *
 * Label sits above the value, always. Reading order matters more than compactness here:
 * the label tells you what frame to interpret the number in, and a number encountered
 * before its frame gets guessed at. Values are tabular so a row of figures aligns on the
 * decimal without a table.
 */
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { AppText } from './AppText';

interface StatProps {
  label: string;
  value: string;
  /** Amber is the reward channel — money and milestones only. */
  tone?: 'default' | 'reward' | 'care' | 'accent';
  /** Optional line under the value for context ("since you started"). */
  footnote?: string;
  size?: 'md' | 'lg';
}

const TONE_COLOR = {
  default: 'textPrimary',
  reward: 'money',
  care: 'care',
  accent: 'accent',
} as const;

export function Stat({ label, value, tone = 'default', footnote, size = 'md' }: StatProps) {
  return (
    <View style={styles.stat}>
      <AppText variant="overline" color="textTertiary">
        {label}
      </AppText>
      <AppText variant={size === 'lg' ? 'displayL' : 'displayM'} color={TONE_COLOR[tone]} tabular>
        {value}
      </AppText>
      {footnote ? (
        <AppText variant="caption" color="textTertiary">
          {footnote}
        </AppText>
      ) : null}
    </View>
  );
}

/** Two or three stats side by side, separated by a hairline. */
export function StatRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

/** Vertical hairline for use between stats in a StatRow. */
export function StatDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  stat: { gap: spacing.xs, flex: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg },
  divider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: colors.border },
});
