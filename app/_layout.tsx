import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { colors, fontMap } from '@/theme';
import { bootstrap } from '@/app-core/bootstrap';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontMap);
  const [ready, setReady] = useState(false);

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
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
