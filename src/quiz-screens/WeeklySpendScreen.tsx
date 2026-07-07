import { Slider } from '@/ui';
import { QuizFrame } from './QuizFrame';

interface Props {
  progress: number;
  value: number;
  onChange: (v: number) => void;
  onContinue: () => void;
}

export function WeeklySpendScreen({ progress, value, onChange, onContinue }: Props) {
  return (
    <QuizFrame
      progress={progress}
      title="What's your weekly spend?"
      subtitle="Pods, disposables, coils — your total nicotine spend per week."
      onContinue={onContinue}
    >
      <Slider min={5} max={150} step={5} value={value} onChange={onChange} formatValue={(v) => `$${v}`} />
    </QuizFrame>
  );
}
