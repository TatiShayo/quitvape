import { View } from 'react-native';
import { AGE_RANGE_OPTIONS } from '@/content/quiz';
import { OptionCard } from '@/ui';
import { spacing } from '@/theme';
import { QuizAnswers } from '@/store';
import { QuizFrame } from './QuizFrame';

interface Props {
  progress: number;
  value: QuizAnswers['ageRange'];
  onChange: (v: QuizAnswers['ageRange']) => void;
  onContinue: () => void;
}

export function AgeRangeScreen({ progress, value, onChange, onContinue }: Props) {
  return (
    <QuizFrame
      progress={progress}
      title="How old are you?"
      subtitle="This helps us tailor your quit plan and health milestones."
      onContinue={onContinue}
      ctaDisabled={!value}
    >
      <View style={{ gap: spacing.md }}>
        {AGE_RANGE_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            selected={value === opt.value}
            onPress={() => onChange(opt.value)}
          />
        ))}
      </View>
    </QuizFrame>
  );
}
