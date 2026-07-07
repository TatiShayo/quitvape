import { Slider } from '@/ui';
import { QuizFrame } from './QuizFrame';

interface Props {
  progress: number;
  value: number;
  onChange: (v: number) => void;
  onContinue: () => void;
}

export function YearsVapingScreen({ progress, value, onChange, onContinue }: Props) {
  return (
    <QuizFrame
      progress={progress}
      title="How long have you been vaping?"
      subtitle="Round to the nearest year. Be honest — this only shapes your plan."
      onContinue={onContinue}
    >
      <Slider
        min={0}
        max={15}
        step={1}
        value={value}
        onChange={onChange}
        formatValue={(v) => (v === 0 ? '< 1 year' : `${v} year${v === 1 ? '' : 's'}`)}
      />
    </QuizFrame>
  );
}
