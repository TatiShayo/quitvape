import { StyleSheet, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { AppText, Card, Odometer } from '@/ui';
import { colors, spacing } from '@/theme';
import { formatMoney, savingsProjection } from '@/domain/money';
import { QuizFrame } from './QuizFrame';

interface Props {
  progress: number;
  vapeCostPerWeek: number;
  onContinue: () => void;
}

const CHART_WIDTH = 300;
const CHART_HEIGHT = 120;

/** Simple upward growth curve illustrating cumulative savings over a year. */
function growthPath(): string {
  const points = 24;
  let d = '';
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    // ease-out curve so the growth visually decelerates like compounding avoidance,
    // matching the shape savers intuitively expect.
    const y = CHART_HEIGHT - (1 - (1 - t) ** 2) * CHART_HEIGHT * 0.92 - 4;
    const x = t * CHART_WIDTH;
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  return d;
}

export function SavingsChartScreen({ progress, vapeCostPerWeek, onContinue }: Props) {
  const { oneYear, fiveYear } = savingsProjection(vapeCostPerWeek);

  return (
    <QuizFrame
      progress={progress}
      title="Your projected savings"
      subtitle="Based on your weekly spend, staying vape-free adds up fast."
      onContinue={onContinue}
      scroll
    >
      <Card style={styles.chartCard}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
          <Line x1={0} y1={CHART_HEIGHT - 1} x2={CHART_WIDTH} y2={CHART_HEIGHT - 1} stroke={colors.border} strokeWidth={1} />
          <Path d={growthPath()} stroke={colors.money} strokeWidth={3} fill="none" strokeLinecap="round" />
        </Svg>
        <AppText variant="caption" color="textTertiary" center>
          Projected savings over 12 months
        </AppText>
      </Card>

      <View style={styles.row}>
        <Card style={styles.statCard}>
          <AppText variant="caption" color="textTertiary">
            1 year
          </AppText>
          <Odometer target={oneYear} formatter={(n) => `$${formatMoney(n)}`} variant="displayM" />
        </Card>
        <Card style={styles.statCard}>
          <AppText variant="caption" color="textTertiary">
            5 years
          </AppText>
          <Odometer target={fiveYear} formatter={(n) => `$${formatMoney(n)}`} variant="displayM" />
        </Card>
      </View>

      <AppText variant="body" color="textSecondary" style={styles.note}>
        That&apos;s real money back in your life — for a trip, a car payment, or just
        breathing room.
      </AppText>
    </QuizFrame>
  );
}

const styles = StyleSheet.create({
  chartCard: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  statCard: { flex: 1, gap: spacing.xs },
  note: { marginTop: spacing.xl },
});
