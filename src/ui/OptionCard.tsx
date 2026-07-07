/** Selectable option row for quiz single/multi-select screens. Themed radio/checkbox. */
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { colors, radii, spacing } from '@/theme';
import { AppText } from './AppText';

interface OptionCardProps {
  label: string;
  sublabel?: string;
  selected: boolean;
  onPress: () => void;
  /** 'radio' for single-select screens, 'checkbox' for multi-select. */
  kind?: 'radio' | 'checkbox';
}

export function OptionCard({ label, sublabel, selected, onPress, kind = 'radio' }: OptionCardProps) {
  return (
    <Pressable
      accessibilityRole={kind === 'radio' ? 'radio' : 'checkbox'}
      accessibilityState={{ selected, checked: selected }}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={styles.textCol}>
        <AppText variant="bodyStrong">{label}</AppText>
        {sublabel ? (
          <AppText variant="caption" color="textTertiary" style={styles.sublabel}>
            {sublabel}
          </AppText>
        ) : null}
      </View>
      <View
        style={[
          styles.indicator,
          kind === 'checkbox' && styles.indicatorSquare,
          selected && styles.indicatorSelected,
        ]}
      >
        {selected ? <Check color={colors.textInverse} size={14} strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
  },
  cardSelected: { borderColor: colors.accent, backgroundColor: colors.surfaceElevated },
  textCol: { flex: 1, paddingRight: spacing.md },
  sublabel: { marginTop: 2 },
  indicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorSquare: { borderRadius: radii.sm },
  indicatorSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
});
