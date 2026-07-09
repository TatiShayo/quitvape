import { useState } from 'react';
import { Alert, Share, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppText, Button, Card, Screen } from '@/ui';
import { colors, spacing } from '@/theme';
import { useBuddy } from '@/app-core/useBuddy';
import { useQuitStore } from '@/store';
import { useNow } from '@/app-core/useNow';
import { currentStreakDays } from '@/domain/streak';
import { ENCOURAGEMENT_PRESETS } from '@/content/encouragements';
import { AnalyticsEvent, getAnalytics } from '@/providers';

/**
 * Accountability buddy screen (BUILD_PROMPT feature 12): invite deep-link generation +
 * a manual paste-in fallback (no simulator/second device available to test real deep
 * linking on this machine), paired-streak comparison, and preset-only "tap to send"
 * encouragements. NO chat — presets only, per BUILD_PROMPT.
 */
export default function Buddy() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const plan = useQuitStore((s) => s.plan);
  const now = useNow(60_000);
  const myStreakDays = plan ? currentStreakDays(new Date(plan.streakStart), now) : 0;

  const { buddy, loading, createInvite, acceptInvite, sendEncouragement, inviteUrl } = useBuddy();
  const [tokenInput, setTokenInput] = useState(params.token ?? '');
  const [busy, setBusy] = useState(false);
  const [sentPresets, setSentPresets] = useState<Set<string>>(new Set());

  async function onCreateInvite() {
    setBusy(true);
    try {
      await createInvite();
      getAnalytics().capture(AnalyticsEvent.buddyInviteCreated);
    } catch {
      Alert.alert('Could not create an invite', 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function onShareInvite() {
    if (!inviteUrl) return;
    await Share.share({
      message: `Join me on QuitVape as my accountability buddy: ${inviteUrl}`,
      url: inviteUrl,
    });
  }

  async function onAccept() {
    if (!tokenInput.trim()) return;
    setBusy(true);
    try {
      await acceptInvite(tokenInput.trim());
      getAnalytics().capture(AnalyticsEvent.buddyInviteAccepted);
    } catch {
      Alert.alert('Invalid invite', 'That invite link is invalid, already used, or has expired.');
    } finally {
      setBusy(false);
    }
  }

  async function onSend(presetId: (typeof ENCOURAGEMENT_PRESETS)[number]['id']) {
    setSentPresets((prev) => new Set(prev).add(presetId));
    try {
      await sendEncouragement(presetId);
    } catch {
      setSentPresets((prev) => {
        const next = new Set(prev);
        next.delete(presetId);
        return next;
      });
    }
  }

  if (loading) {
    return (
      <Screen>
        <AppText variant="body" color="textTertiary">
          Loading…
        </AppText>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <AppText variant="overline" color="accent">
        Buddy
      </AppText>
      <AppText variant="title" style={styles.title}>
        Accountability buddy
      </AppText>

      {buddy?.paired ? (
        <>
          <Card style={styles.streakCard}>
            <View style={styles.streakCol}>
              <AppText variant="caption" color="textTertiary">
                You
              </AppText>
              <AppText variant="displayM" tabular color="accent">
                {myStreakDays}d
              </AppText>
            </View>
            <View style={styles.streakCol}>
              <AppText variant="caption" color="textTertiary">
                {buddy.buddyAnonHandle ?? 'Your buddy'}
              </AppText>
              <AppText variant="displayM" tabular>
                {buddy.buddyStreakDays ?? 0}d
              </AppText>
            </View>
          </Card>

          <AppText variant="bodyStrong" style={styles.sectionTitle}>
            Send encouragement
          </AppText>
          <View style={styles.presetGrid}>
            {ENCOURAGEMENT_PRESETS.map((preset) => {
              const sent = sentPresets.has(preset.id);
              return (
                <Button
                  key={preset.id}
                  label={sent ? 'Sent' : preset.label}
                  variant={sent ? 'secondary' : 'primary'}
                  disabled={sent}
                  onPress={() => void onSend(preset.id)}
                  style={styles.presetButton}
                />
              );
            })}
          </View>
        </>
      ) : buddy?.inviteToken ? (
        <Card style={styles.card}>
          <AppText variant="bodyStrong">Waiting for your buddy to join</AppText>
          <AppText variant="body" color="textSecondary">
            Share this invite link — once they open it and accept, you&apos;ll both see each
            other&apos;s streak here.
          </AppText>
          <Button label="Share invite link" onPress={() => void onShareInvite()} />
        </Card>
      ) : (
        <Card style={styles.card}>
          <AppText variant="bodyStrong">Quit with a friend</AppText>
          <AppText variant="body" color="textSecondary">
            Invite someone to pair up. You&apos;ll see each other&apos;s streak and get notified
            on milestones — no chat, just encouragement.
          </AppText>
          <Button label="Create invite" onPress={() => void onCreateInvite()} disabled={busy} />
        </Card>
      )}

      {!buddy?.paired ? (
        <Card style={styles.card}>
          <AppText variant="bodyStrong">Have an invite link?</AppText>
          <TextInput
            value={tokenInput}
            onChangeText={setTokenInput}
            placeholder="Paste invite token"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button label="Join as buddy" onPress={() => void onAccept()} disabled={busy || !tokenInput.trim()} />
        </Card>
      ) : null}

      <Button label="Back" onPress={() => router.back()} variant="ghost" style={styles.back} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm, marginBottom: spacing.xl },
  card: { marginBottom: spacing.lg, gap: spacing.md },
  streakCard: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.xl },
  streakCol: { alignItems: 'center', gap: spacing.xs },
  sectionTitle: { marginBottom: spacing.md },
  presetGrid: { gap: spacing.sm, marginBottom: spacing.xl },
  presetButton: { marginBottom: 0 },
  input: {
    color: colors.textPrimary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  back: { marginTop: spacing.md },
});
