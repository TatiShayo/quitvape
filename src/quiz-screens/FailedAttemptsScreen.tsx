import { StyleSheet } from 'react-native';
import { AppText, Slider } from '@/ui';
import { spacing } from '@/theme';
import { QuizFrame } from './QuizFrame';

interface Props {
  progress: number;
  value: number;
  onChange: (v: number) => void;
  onContinue: () => void;
}

export function FailedAttemptsScreen({ progress, value, onChange, onContinue }: Props) {
  return (
    <QuizFrame
      progress={progress}
      title="How many times have you tried to quit?"
      subtitle="Most people need 3+ attempts before it sticks. Every attempt teaches you something."
      onContinue={onContinue}
    >
      <Slider min={0} max={10} step={1} value={value} onChange={onChange} formatValue={(v) => (v >= 10 ? '10+' : String(v))} />
      <AppText variant="caption" color="textTertiary" center style={styles.note}>
        Zero is a fine answer — everyone starts somewhere.
      </AppText>
    </QuizFrame>
  );
}

const styles = StyleSheet.create({
  note: { marginTop: spacing.xl },
});
