import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppText, Button, Screen } from '@/ui';
import { spacing } from '@/theme';
import { useOnboardingStore } from '@/store';
import { getAnalytics, AnalyticsEvent } from '@/providers';
import { useEffect } from 'react';

/**
 * Placeholder 12-screen quiz scaffold. The full personalized quiz (sliders, gauge,
 * savings chart) lands in milestone 2; this stub wires routing, per-screen analytics,
 * and drop-off tracking so the flow is walkable end-to-end now.
 */
const TOTAL_SCREENS = 12;

export default function QuizStep() {
  const router = useRouter();
  const { step } = useLocalSearchParams<{ step: string }>();
  const index = Math.max(0, Math.min(TOTAL_SCREENS - 1, Number(step) || 0));
  const markScreen = useOnboardingStore((s) => s.markScreen);

  useEffect(() => {
    markScreen(index);
    getAnalytics().capture(AnalyticsEvent.quizScreenViewed, { screen_index: index });
  }, [index, markScreen]);

  const isLast = index >= TOTAL_SCREENS - 1;

  return (
    <Screen>
      <View style={styles.container}>
        <AppText variant="overline" color="accent">
          Step {index + 1} of {TOTAL_SCREENS}
        </AppText>
        <AppText variant="displayM" style={styles.title}>
          Quiz screen {index + 1}
        </AppText>
        <AppText variant="bodyL" color="textSecondary">
          Placeholder — the personalized onboarding question for this step lands in
          milestone 2.
        </AppText>
        <View style={styles.spacer} />
        <Button
          label={isLast ? 'See my plan' : 'Continue'}
          onPress={() => {
            if (isLast) {
              getAnalytics().capture(AnalyticsEvent.quizCompleted);
              router.replace('/paywall');
            } else {
              router.push({
                pathname: '/(onboarding)/quiz/[step]',
                params: { step: String(index + 1) },
              });
            }
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { marginTop: spacing.sm, marginBottom: spacing.md },
  spacer: { flex: 1 },
});
