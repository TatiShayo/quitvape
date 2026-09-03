/**
 * Font loading map for expo-font's useFonts. Keys MUST match fontFamily values in
 * typography.ts. Self-hosted via @expo-google-fonts.
 *
 * Fraunces (display) is an optical serif — at the hero sizes this app uses it reads
 * warm and human rather than clinical. A geometric grotesk at 96px reads as a dashboard
 * metric; the number on the home screen is not a metric, it is the user's own record,
 * and the type should say so.
 *
 * Inter Tight (body/UI) sets tighter than Inter proper, holds up in dense stat rows,
 * and does not compete with the serif for attention.
 */
import {
  Fraunces_400Regular,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  InterTight_400Regular,
  InterTight_500Medium,
  InterTight_600SemiBold,
} from '@expo-google-fonts/inter-tight';

export const fontMap = {
  Fraunces_400Regular,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  InterTight_400Regular,
  InterTight_500Medium,
  InterTight_600SemiBold,
} as const;
