/**
 * Today's check-in prompt: 5-point mood scale using a consistent icon set (Lucide),
 * never raw emoji as UI (PLAYBOOK 1.1). Collapses to a quiet "done for today" state
 * once submitted.
 */
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Angry, Frown, Laugh, Meh, Smile } from 'lucide-react-native';
import { AppText } from './AppText';
import { Card } from './Card';
import { colors, spacing } from '@/theme';
import { MoodValue } from '@/domain/types';

const MOOD_OPTIONS: { value: MoodValue; Icon: typeof Smile; label: string }[] = [
  { value: 1, Icon: Angry, label: 'Awful' },
  { value: 2, Icon: Frown, label: 'Rough' },
  { value: 3, Icon: Meh, label: 'Okay' },
  { value: 4, Icon: Smile, label: 'Good' },
  { value: 5, Icon: Laugh, label: 'Great' },
];

interface CheckInPromptProps {
  /** Today's already-submitted mood, if any. */
  todaysMood: MoodValue | undefined;
  onSubmit: (mood: MoodValue) => void;
}

export function CheckInPrompt({ todaysMood, onSubmit }: CheckInPromptProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <AppText variant="overline" color="textTertiary">
          {todaysMood ? 'Checked in' : 'Daily check-in'}
        </AppText>
        <AppText variant="bodyStrong">
          {todaysMood ? 'Logged for today' : 'How are you doing?'}
        </AppText>
      </View>
      <View style={styles.row}>
        {MOOD_OPTIONS.map(({ value, Icon, label }) => {
          const selected = todaysMood === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
              hitSlop={4}
              onPress={() => {
                void Haptics.selectionAsync();
                onSubmit(value);
              }}
              style={styles.moodCol}
            >
              <View style={[styles.moodButton, selected && styles.moodButtonSelected]}>
                <Icon color={selected ? colors.accent : colors.textTertiary} size={24} />
              </View>
              {/* Labels are shown, not hidden behind the icon. A five-point face scale is
                  read inconsistently without them — "Meh" vs "Frown" is a coin flip, and
                  inconsistent self-report makes the resulting mood trend worthless. Note
                  the icons are all one neutral colour: a red-to-green mood scale tells
                  the user which answers are the good ones and biases what they log. */}
              <AppText variant="caption" color={selected ? 'textPrimary' : 'textTertiary'} center>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.lg },
  head: { gap: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  moodCol: { alignItems: 'center', gap: spacing.xs, flex: 1 },
  moodButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  moodButtonSelected: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.accentDim,
  },
});
