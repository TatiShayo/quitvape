/** Screen wrapper: dark canvas + safe-area padding + consistent horizontal gutters. */
import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  /** Remove default horizontal gutter (for full-bleed content). */
  bleed?: boolean;
  contentStyle?: ViewStyle;
}

export function Screen({ children, scroll = false, bleed = false, contentStyle }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const padding: ViewStyle = {
    paddingTop: insets.top + spacing.md,
    paddingBottom: insets.bottom + spacing.lg,
    paddingHorizontal: bleed ? 0 : spacing.xl,
  };

  if (scroll) {
    return (
      <ScrollView
        style={styles.canvas}
        contentContainerStyle={[padding, contentStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }
  return <View style={[styles.canvas, padding, contentStyle]}>{children}</View>;
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
