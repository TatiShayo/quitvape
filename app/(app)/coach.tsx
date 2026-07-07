import { StyleSheet, View } from 'react-native';
import { AppText, Card, Screen } from '@/ui';
import { spacing } from '@/theme';

/**
 * AI coach tab placeholder. The chat UI + Supabase Edge Function proxy to Anthropic
 * claude-haiku-4-5 (server-side system prompt, 10 msgs/day cap, kill-switch) lands in
 * the backend milestone. The key is a server-only edge secret and never ships here.
 */
export default function Coach() {
  return (
    <Screen>
      <AppText variant="overline" color="accent">
        Coach
      </AppText>
      <AppText variant="title" style={styles.title}>
        Your quit coach
      </AppText>
      <Card>
        <AppText variant="body" color="textSecondary">
          A private, judgment-free coach trained on CBT techniques is coming here. It
          runs through a secure server proxy — your messages never train anyone else's
          model, and it never gives medical advice.
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm, marginBottom: spacing.xl },
});
