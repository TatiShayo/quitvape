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
      <AppText variant="bodyStrong">
        {todaysMood ? "Today's check-in" : 'How are you feeling today?'}
      </AppText>
      <View style={styles.row}>
        {MOOD_OPTIONS.map(({ value, Icon, label }) => {
          const selected = todaysMood === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
              hitSlop={6}
              onPress={() => {
                void Haptics.selectionAsync();
                onSubmit(value);
              }}
              style={[styles.moodButton, selected && styles.moodButtonSelected]}
            >
              <Icon color={selected ? colors.accent : colors.textTertiary} size={26} />
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  moodButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodButtonSelected: { backgroundColor: colors.surfaceElevated },
});
