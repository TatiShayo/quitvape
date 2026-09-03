/**
 * Screen wrapper: the live sky + safe-area padding + consistent gutters.
 *
 * The Sky is painted per-screen rather than once at the root so that screens which need
 * their own atmosphere (panic mode) can substitute one without fighting a global layer.
 */
import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, SkyStops } from '@/theme';
import { Sky } from './Sky';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  /** Remove default horizontal gutter (for full-bleed content). */
  bleed?: boolean;
  /** Substitute a different sky (e.g. panic mode's cool field). */
  sky?: SkyStops;
  starless?: boolean;
  contentStyle?: ViewStyle;
}

export function Screen({
  children,
  scroll = false,
  bleed = false,
  sky,
  starless,
  contentStyle,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const padding: ViewStyle = {
    paddingTop: insets.top + spacing.lg,
    paddingBottom: insets.bottom + spacing.xxl,
    paddingHorizontal: bleed ? 0 : spacing.xl,
  };

  return (
    <View style={styles.canvas}>
      <Sky stops={sky} starless={starless} />
      {scroll ? (
        <ScrollView
          style={styles.fill}
          contentContainerStyle={[padding, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, padding, contentStyle]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { flex: 1, backgroundColor: colors.bg },
  fill: { flex: 1 },
});
