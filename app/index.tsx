import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme';
import { useAppGate } from '@/app-core/useAppGate';

/** Entry redirector: routes to the correct stage based on the app gate. */
export default function Index() {
  const router = useRouter();
  const { target } = useAppGate();

  useEffect(() => {
    switch (target) {
      case 'age-gate':
        router.replace('/(onboarding)/age-gate');
        break;
      case 'onboarding':
        router.replace({ pathname: '/(onboarding)/quiz/[step]', params: { step: '0' } });
        break;
      case 'paywall':
        router.replace('/paywall');
        break;
      case 'app':
        router.replace('/(app)/home');
        break;
      default:
        break;
    }
  }, [target, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}
