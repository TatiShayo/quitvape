import { View } from 'react-native';
import { DEVICE_TYPE_OPTIONS } from '@/content/quiz';
import { OptionCard } from '@/ui';
import { spacing } from '@/theme';
import { QuizAnswers } from '@/store';
import { QuizFrame } from './QuizFrame';

interface Props {
  progress: number;
  value: QuizAnswers['deviceType'];
  onChange: (v: QuizAnswers['deviceType']) => void;
  onContinue: () => void;
}

export function DeviceTypeScreen({ progress, value, onChange, onContinue }: Props) {
  return (
    <QuizFrame
      progress={progress}
      title="What's your device?"
      subtitle="Different devices deliver nicotine differently — this fine-tunes your score."
      onContinue={onContinue}
      ctaDisabled={!value}
    >
      <View style={{ gap: spacing.md }}>
        {DEVICE_TYPE_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            sublabel={opt.sublabel}
            selected={value === opt.value}
            onPress={() => onChange(opt.value)}
          />
        ))}
      </View>
    </QuizFrame>
  );
}
