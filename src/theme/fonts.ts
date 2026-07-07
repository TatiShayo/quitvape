/**
 * Font loading map for expo-font's useFonts. Keys MUST match fontFamily values in
 * typography.ts. Self-hosted via @expo-google-fonts (font-display swap handled by RN).
 */
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';

export const fontMap = {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} as const;
