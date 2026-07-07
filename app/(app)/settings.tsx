import { useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Card, Screen } from '@/ui';
import { spacing } from '@/theme';
import { getBackend, getErrors, getPurchasesProvider } from '@/providers';
import { useLocalDataWipe } from '@/app-core/useDataDeletion';
import { NOT_MEDICAL_ADVICE, QUIT_HOTLINES } from '@/content/disclaimers';

export default function Settings() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const wipeLocal = useLocalDataWipe();
  const hotline = QUIT_HOTLINES[0];

  function confirmDelete() {
    Alert.alert(
      'Delete all my data',
      'This permanently erases your streak, check-ins, cravings, and any community posts. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: () => void performDelete(),
        },
      ],
    );
  }

  async function performDelete() {
    setBusy(true);
    try {
      await getBackend().deleteAllUserData();
      wipeLocal();
      router.replace('/');
    } catch (e) {
      getErrors().captureException(e, { where: 'settings.deleteAllData' });
      Alert.alert('Could not delete data', 'Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function onRestore() {
    setBusy(true);
    try {
      await getPurchasesProvider().restore();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll>
      <AppText variant="overline" color="accent">
        Settings
      </AppText>
      <AppText variant="title" style={styles.title}>
        Your account
      </AppText>

      <Card style={styles.card}>
        <AppText variant="bodyStrong">Purchases</AppText>
        <Button label="Restore purchases" onPress={onRestore} variant="secondary" disabled={busy} />
      </Card>

      <Card style={styles.card}>
        <AppText variant="bodyStrong">Progress</AppText>
        <Button label="Weekly report" onPress={() => router.push('/weekly-report')} variant="secondary" />
        <Button label="Achievements" onPress={() => router.push('/achievements')} variant="secondary" />
      </Card>

      <Card style={styles.card}>
        <AppText variant="bodyStrong">Get help quitting</AppText>
        <AppText variant="caption" color="textSecondary">
          {hotline.name}: {hotline.phone}
        </AppText>
        <Button
          label={`Call ${hotline.phone}`}
          onPress={() => void Linking.openURL(hotline.tel)}
          variant="secondary"
        />
      </Card>

      <Card style={styles.card}>
        <AppText variant="caption" color="textTertiary">
          {NOT_MEDICAL_ADVICE}
        </AppText>
      </Card>

      <View style={styles.danger}>
        <Button label="Delete all my data" onPress={confirmDelete} variant="danger" disabled={busy} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm, marginBottom: spacing.xl },
  card: { marginBottom: spacing.lg, gap: spacing.md },
  danger: { marginTop: spacing.xl },
});
