import { StyleSheet, View } from 'react-native';
import { AppText, Gauge } from '@/ui';
import { colors, spacing } from '@/theme';
import { dependencyBand, dependencyScore } from '@/domain/dependency';
import { DEPENDENCY_BAND_COPY } from '@/content/quiz';
import { QuizAnswers } from '@/store';
import { QuizFrame } from './QuizFrame';

interface Props {
  progress: number;
  answers: QuizAnswers;
  onContinue: () => void;
}

const BAND_COLOR: Record<ReturnType<typeof dependencyBand>, string> = {
  low: colors.success,
  moderate: colors.accent,
  high: colors.warning,
  severe: colors.danger,
};

export function DependencyScoreScreen({ progress, answers, onContinue }: Props) {
  const score = dependencyScore({
    firstPuffOnWaking: answers.firstPuffOnWaking ?? false,
    puffsPerDay: answers.puffsPerDay ?? 150,
    yearsVaping: answers.yearsVaping ?? 2,
    failedQuitAttempts: answers.failedQuitAttempts ?? 1,
    nicotineStrengthMgMl: answers.nicotineStrengthMgMl,
  });
  const band = dependencyBand(score);

  return (
    <QuizFrame progress={progress} title="Your dependency score" onContinue={onContinue} scroll>
      <View style={styles.gaugeWrap}>
        <Gauge value={score} bandColor={BAND_COLOR[band]} />
      </View>
      <AppText variant="bodyL" color="textSecondary" style={styles.copy}>
        {DEPENDENCY_BAND_COPY[band]}
      </AppText>
    </QuizFrame>
  );
}

const styles = StyleSheet.create({
  gaugeWrap: { alignItems: 'center', marginTop: spacing.xl },
  copy: { marginTop: spacing.xxl },
});
