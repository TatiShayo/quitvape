/**
 * Fades in the user's own "why I quit" reasons one at a time (BUILD_PROMPT signature
 * panic-button close: "their own 'why I quit' words fading in one by one"). Each label
 * fades in ~500ms after the previous, so someone mid-craving reads their own reasons
 * arriving one at a time rather than a static list dumped on screen.
 */
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { AppText } from './AppText';
import { spacing } from '@/theme';

interface WhyIQuitRevealProps {
  labels: string[];
}

const STEP_MS = 450;

function RevealLine({ label, index }: { label: string; index: number }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(index * STEP_MS, withTiming(1, { duration: 400 }));
  }, [index, opacity]);

  return (
    <Animated.View style={{ opacity }}>
      <AppText variant="title" center>
        {label}
      </AppText>
    </Animated.View>
  );
}

export function WhyIQuitReveal({ labels }: WhyIQuitRevealProps) {
  if (labels.length === 0) return null;
  return (
    <View style={styles.wrap}>
      {labels.map((label, i) => (
        <RevealLine key={label} label={label} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, alignItems: 'center' },
});
