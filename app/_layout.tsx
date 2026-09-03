import { useEffect, useMemo, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { colors, fontMap, skyProgress } from '@/theme';
import { ErrorBoundary, SkyProvider } from '@/ui';
import { bootstrap } from '@/app-core/bootstrap';
import { useQuitStore } from '@/store';
import { currentStreakDays } from '@/domain/streak';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontMap);
  const [ready, setReady] = useState(false);
  const plan = useQuitStore((s) => s.plan);

  // Ambient sky position for the whole app. Derived once from the streak — screens read
  // it via useSky() so every surface shares the same light level rather than each one
  // inventing its own background.
  const progress = useMemo(() => {
    if (!plan) return 0;
    return skyProgress(currentStreakDays(new Date(plan.streakStart), new Date()));
  }, [plan]);

  useEffect(() => {
    void bootstrap().finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && ready) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, ready]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <SkyProvider progress={progress}>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
                animation: 'fade',
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
              <Stack.Screen name="(app)" />
              <Stack.Screen name="panic" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
              <Stack.Screen name="relapse" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
              <Stack.Screen name="achievements" options={{ presentation: 'modal' }} />
              <Stack.Screen name="weekly-report" options={{ presentation: 'modal' }} />
              <Stack.Screen name="buddy" options={{ presentation: 'modal' }} />
            </Stack>
          </SkyProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
