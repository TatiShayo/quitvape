import { StyleSheet, View } from 'react-native';
import { AppText, Card, OptionCard } from '@/ui';
import { spacing } from '@/theme';
import { QUIT_METHOD_OPTIONS } from '@/content/quiz';
import { QuitMethod } from '@/domain/types';
import { dailyAllowance } from '@/domain/taper';
import { QuizFrame } from './QuizFrame';

interface Props {
  progress: number;
  method: QuitMethod | undefined;
  onChangeMethod: (m: QuitMethod) => void;
  puffsPerDay: number;
  onContinue: () => void;
}

export function QuitPlanScreen({ progress, method, onChangeMethod, puffsPerDay, onContinue }: Props) {
  const week1Allowance = dailyAllowance(puffsPerDay, 1);

  return (
    <QuizFrame
      progress={progress}
      title="Your quit plan"
      subtitle="Choose how you want to get there. You can change this anytime in settings."
      onContinue={onContinue}
      ctaDisabled={!method}
      ctaLabel="See my plan"
      scroll
    >
      <View style={styles.options}>
        {QUIT_METHOD_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            sublabel={opt.sublabel}
            selected={method === opt.value}
            onPress={() => onChangeMethod(opt.value)}
          />
        ))}
      </View>

      {method === 'taper' ? (
        <Card style={styles.previewCard}>
          <AppText variant="bodyStrong">Week 1 allowance</AppText>
          <AppText variant="displayM" color="accent" tabular>
            {week1Allowance} puffs/day
          </AppText>
          <AppText variant="caption" color="textSecondary">
            Stepping down 15% every week until you&apos;re ready for a full quit.
          </AppText>
        </Card>
      ) : method === 'cold_turkey' ? (
        <Card style={styles.previewCard}>
          <AppText variant="bodyStrong">Starting today</AppText>
          <AppText variant="body" color="textSecondary" style={styles.previewBody}>
            Your streak starts the moment you finish this quiz. We&apos;ll be with you
            for every craving.
          </AppText>
        </Card>
      ) : null}
    </QuizFrame>
  );
}

const styles = StyleSheet.create({
  options: { gap: spacing.md },
  previewCard: { marginTop: spacing.xl, gap: spacing.sm },
  previewBody: { marginTop: spacing.xs },
});
