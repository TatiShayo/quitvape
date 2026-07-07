import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Screen } from '@/ui';
import { spacing } from '@/theme';
import { useOnboardingStore } from '@/store';
import { AGE_GATE_BODY, AGE_GATE_TITLE, NOT_MEDICAL_ADVICE } from '@/content/disclaimers';

export default function AgeGate() {
  const router = useRouter();
  const confirmAge = useOnboardingStore((s) => s.confirmAge);

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.top}>
          <AppText variant="overline" color="accent">
            Before we begin
          </AppText>
          <AppText variant="displayM" style={styles.title}>
            {AGE_GATE_TITLE}
          </AppText>
          <AppText variant="bodyL" color="textSecondary">
            {AGE_GATE_BODY}
          </AppText>
        </View>

        <View style={styles.actions}>
          <Button
            label="Yes, I'm 18 or older"
            onPress={() => {
              confirmAge();
              router.replace({ pathname: '/(onboarding)/quiz/[step]', params: { step: '0' } });
            }}
          />
          <AppText variant="caption" color="textTertiary" center style={styles.disclaimer}>
            {NOT_MEDICAL_ADVICE}
          </AppText>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between' },
  top: { marginTop: spacing.huge, gap: spacing.md },
  title: { marginTop: spacing.sm },
  actions: { gap: spacing.lg },
  disclaimer: { paddingHorizontal: spacing.sm },
});
