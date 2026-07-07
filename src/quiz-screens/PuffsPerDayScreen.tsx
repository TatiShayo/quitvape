import { Slider } from '@/ui';
import { QuizFrame } from './QuizFrame';

interface Props {
  progress: number;
  value: number;
  onChange: (v: number) => void;
  onContinue: () => void;
}

export function PuffsPerDayScreen({ progress, value, onChange, onContinue }: Props) {
  return (
    <QuizFrame
      progress={progress}
      title="How much do you vape?"
      subtitle="An estimate is fine — most people vape 100-300 puffs a day without realizing it."
      onContinue={onContinue}
    >
      <Slider min={10} max={400} step={10} value={value} onChange={onChange} formatValue={(v) => `${v}/day`} />
    </QuizFrame>
  );
}
