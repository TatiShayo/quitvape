import { View } from 'react-native';
import { FIRST_PUFF_OPTIONS } from '@/content/quiz';
import { OptionCard } from '@/ui';
import { spacing } from '@/theme';
import { QuizFrame } from './QuizFrame';

interface Props {
  progress: number;
  value: boolean | undefined;
  onChange: (v: boolean) => void;
  onContinue: () => void;
}

export function FirstPuffScreen({ progress, value, onChange, onContinue }: Props) {
  const selectedKey = value === undefined ? undefined : value ? 'yes' : 'no';
  return (
    <QuizFrame
      progress={progress}
      title="When do you take your first puff?"
      subtitle="This is one of the strongest signs of how dependent your body has become."
      onContinue={onContinue}
      ctaDisabled={value === undefined}
    >
      <View style={{ gap: spacing.md }}>
        {FIRST_PUFF_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            sublabel={opt.sublabel}
            selected={selectedKey === opt.value}
            onPress={() => onChange(opt.value === 'yes')}
          />
        ))}
      </View>
    </QuizFrame>
  );
}
