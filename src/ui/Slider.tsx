/**
 * Themed slider primitive (no off-the-shelf slider dependency — built on
 * gesture-handler + reanimated, already project dependencies, for full theming
 * control per PLAYBOOK 1.1 "never ship a default-look control unmodified").
 * Snaps to integer steps, haptic tick on each step change, tabular numeral readout.
 */
import { useCallback, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, radii, spacing, spring } from '@/theme';
import { AppText } from './AppText';

interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  /** Formats the readout above the track, e.g. "150 puffs/day". */
  formatValue?: (value: number) => string;
}

const THUMB_SIZE = 28;
const TRACK_HEIGHT = 6;

export function Slider({ min, max, step = 1, value, onChange, formatValue }: SliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const usableWidth = Math.max(1, trackWidth - THUMB_SIZE);
  const clamped = Math.min(max, Math.max(min, value));
  const progress = max > min ? (clamped - min) / (max - min) : 0;
  const thumbX = useSharedValue(progress * usableWidth);
  const startX = useSharedValue(0);

  function onLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    setTrackWidth(w);
    thumbX.value = progress * Math.max(1, w - THUMB_SIZE);
  }

  // Tracks the last step value committed to JS so the worklet only crosses the
  // bridge when the *stepped* value actually changes (perf: previously runOnJS fired
  // on every gesture frame — 60-120 calls/s each triggering the JS closure, a store
  // write and a re-render; now it's one call per detent).
  const lastStepped = useSharedValue(clamped);

  const commit = useCallback(
    (next: number) => {
      onChange(next);
      void Haptics.selectionAsync();
    },
    [onChange],
  );

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.value = thumbX.value;
      lastStepped.value = clamped;
    })
    .onUpdate((e) => {
      const next = Math.min(usableWidth, Math.max(0, startX.value + e.translationX));
      thumbX.value = next;
      const p = Math.min(1, Math.max(0, next / usableWidth));
      const raw = min + p * (max - min);
      const stepped = Math.min(max, Math.max(min, Math.round(raw / step) * step));
      if (stepped !== lastStepped.value) {
        lastStepped.value = stepped;
        runOnJS(commit)(stepped);
      }
    })
    .onEnd(() => {
      thumbX.value = withSpring(thumbX.value, spring.gentle);
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }));
  const fillStyle = useAnimatedStyle(() => ({
    width: thumbX.value + THUMB_SIZE / 2,
  }));

  return (
    <View>
      <AppText variant="displayM" color="accent" tabular center style={styles.readout}>
        {formatValue ? formatValue(clamped) : String(clamped)}
      </AppText>
      <GestureDetector gesture={pan}>
        <View style={styles.track} onLayout={onLayout}>
          <View style={styles.trackBg} />
          <Animated.View style={[styles.trackFill, fillStyle]} />
          <Animated.View style={[styles.thumb, thumbStyle]} />
        </View>
      </GestureDetector>
      <View style={styles.labelsRow}>
        <AppText variant="caption" color="textTertiary" tabular>
          {formatValue ? formatValue(min) : min}
        </AppText>
        <AppText variant="caption" color="textTertiary" tabular>
          {formatValue ? formatValue(max) : max}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { marginBottom: spacing.xl },
  track: { height: THUMB_SIZE, justifyContent: 'center' },
  trackBg: {
    position: 'absolute',
    left: THUMB_SIZE / 2,
    right: THUMB_SIZE / 2,
    height: TRACK_HEIGHT,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceElevated,
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: TRACK_HEIGHT,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingHorizontal: THUMB_SIZE / 2,
  },
});
