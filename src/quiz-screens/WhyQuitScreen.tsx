import { View } from 'react-native';
import { QUIT_REASON_OPTIONS } from '@/content/quiz';
import { OptionCard } from '@/ui';
import { spacing } from '@/theme';
import { QuitReason } from '@/domain/types';
import { QuizFrame } from './QuizFrame';

interface Props {
  progress: number;
  value: QuitReason[];
  onChange: (v: QuitReason[]) => void;
  onContinue: () => void;
}

export function WhyQuitScreen({ progress, value, onChange, onContinue }: Props) {
  function toggle(reason: QuitReason) {
    onChange(value.includes(reason) ? value.filter((r) => r !== reason) : [...value, reason]);
  }

  return (
    <QuizFrame
      progress={progress}
      title="Why are you quitting?"
      subtitle="Select every reason that applies. We'll bring these back to you when it gets hard."
      onContinue={onContinue}
      ctaDisabled={value.length === 0}
    >
      <View style={{ gap: spacing.md }}>
        {QUIT_REASON_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            kind="checkbox"
            label={opt.label}
            sublabel={opt.sublabel}
            selected={value.includes(opt.value)}
            onPress={() => toggle(opt.value)}
          />
        ))}
      </View>
    </QuizFrame>
  );
}
