/**
 * The Sky — QuitVape's ambient progress canvas.
 *
 * Every screen is painted on this. The light level is a direct function of streak length
 * (see theme/sky.ts), so the user's standing is communicated before a single word is
 * read. This is deliberate: during a craving, executive function is suppressed and the
 * user cannot be asked to parse a number. Ambient lightness is processed pre-attentively.
 *
 * The stars fade out as the sky lightens — a second, redundant encoding of the same
 * value. Redundant encoding is a legibility win, not decoration: it survives dim screens,
 * blue-light filters, and low colour vision, all of which flatten a gradient.
 */
import { createContext, memo, ReactNode, useContext, useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { duration, skyAt, SkyStops } from '@/theme';

interface SkyValue {
  /** 0..1 position along the night -> first-light ramp. */
  progress: number;
  stops: SkyStops;
}

const SkyContext = createContext<SkyValue>({ progress: 0, stops: skyAt(0) });

export function useSky(): SkyValue {
  return useContext(SkyContext);
}

/**
 * Provide the sky position for the whole app. Mounted once at the root and fed the
 * user's streak; individual screens read it via useSky() to tint accents in sympathy.
 */
export function SkyProvider({ progress, children }: { progress: number; children: ReactNode }) {
  const value = useMemo<SkyValue>(
    () => ({ progress, stops: skyAt(progress) }),
    [progress],
  );
  return <SkyContext.Provider value={value}>{children}</SkyContext.Provider>;
}

interface SkyProps {
  /** Override the ambient progress (panic mode supplies its own cool sky). */
  stops?: SkyStops;
  /** Hide the star field regardless of progress. */
  starless?: boolean;
}

/**
 * Deterministic star positions — a fixed constellation, not random per render. A star
 * field that reshuffles on every mount reads as noise; one that stays put reads as a
 * place the user returns to.
 */
const STARS: { x: number; y: number; r: number; o: number }[] = [
  { x: 0.12, y: 0.08, r: 1.4, o: 0.9 }, { x: 0.31, y: 0.14, r: 1.0, o: 0.6 },
  { x: 0.48, y: 0.05, r: 1.6, o: 1.0 }, { x: 0.67, y: 0.11, r: 1.1, o: 0.7 },
  { x: 0.84, y: 0.06, r: 1.3, o: 0.85 }, { x: 0.92, y: 0.19, r: 0.9, o: 0.5 },
  { x: 0.21, y: 0.24, r: 1.2, o: 0.75 }, { x: 0.55, y: 0.21, r: 0.9, o: 0.55 },
  { x: 0.74, y: 0.28, r: 1.4, o: 0.8 }, { x: 0.08, y: 0.33, r: 1.0, o: 0.5 },
  { x: 0.39, y: 0.31, r: 1.5, o: 0.9 }, { x: 0.88, y: 0.36, r: 1.0, o: 0.45 },
  { x: 0.26, y: 0.42, r: 0.9, o: 0.4 }, { x: 0.62, y: 0.39, r: 1.1, o: 0.6 },
  { x: 0.45, y: 0.47, r: 0.8, o: 0.35 },
];

export const Sky = memo(function Sky({ stops, starless = false }: SkyProps) {
  const ambient = useSky();
  const s = stops ?? ambient.stops;
  const { height } = useWindowDimensions();

  // Stars dim out across the first two thirds of the journey, then are gone.
  const starOpacity = starless ? 0 : Math.max(0, 1 - ambient.progress * 1.5);

  // Cross-fade whenever the sky changes (day rollover, entering panic mode) rather than
  // cutting. A hard cut on a full-screen colour reads as an error state.
  const fade = useSharedValue(0);
  useEffect(() => {
    fade.value = 0;
    fade.value = withTiming(1, { duration: duration.slow });
  }, [s.zenith, s.horizon, fade]);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, fadeStyle]}>
        <LinearGradient
          colors={[s.zenith, s.field, s.low, s.horizon]}
          locations={[0, 0.42, 0.78, 1]}
          style={StyleSheet.absoluteFill}
        />

        {starOpacity > 0.01 ? (
          <View style={[StyleSheet.absoluteFill, { opacity: starOpacity }]}>
            {STARS.map((star, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  left: `${star.x * 100}%`,
                  top: star.y * height,
                  width: star.r * 2,
                  height: star.r * 2,
                  borderRadius: star.r,
                  backgroundColor: '#FFFFFF',
                  opacity: star.o * 0.7,
                }}
              />
            ))}
          </View>
        ) : null}

        {/* The horizon ember: warmth arrives from below, never from behind the text. */}
        <LinearGradient
          colors={['transparent', s.horizon]}
          locations={[0, 1]}
          style={styles.ember}
        />
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  ember: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '30%',
    opacity: 0.55,
  },
});
