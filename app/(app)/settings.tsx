import { useState } from 'react';
import { Alert, Linking, StyleSheet, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Card, Screen } from '@/ui';
import { colors, spacing } from '@/theme';
import { getBackend, getErrors, getPurchasesProvider } from '@/providers';
import { useLocalDataWipe } from '@/app-core/useDataDeletion';
import { cancelAllQuitVapeNotifications, scheduleAllNotifications } from '@/app-core/notifications';
import { NOT_MEDICAL_ADVICE, QUIT_HOTLINES } from '@/content/disclaimers';
import { NotificationPrefs, useQuitStore, useSettingsStore } from '@/store';
import { currentStreakDays } from '@/domain/streak';

const TOGGLE_ROWS: { key: keyof Omit<NotificationPrefs, 'morningTime'>; label: string }[] = [
  { key: 'morningMotivation', label: 'Morning motivation' },
  { key: 'eveningCheckIn', label: 'Evening check-in' },
  { key: 'milestones', label: 'Milestone celebrations' },
  { key: 'dangerHour', label: 'Danger-hour support' },
  { key: 'weeklyReport', label: 'Weekly report' },
  { key: 'buddy', label: 'Buddy updates' },
];

export default function Settings() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const wipeLocal = useLocalDataWipe();
  const hotline = QUIT_HOTLINES[0];
  const notifications = useSettingsStore((s) => s.notifications);
  const setNotificationPref = useSettingsStore((s) => s.setNotificationPref);
  const plan = useQuitStore((s) => s.plan);
  const cravings = useQuitStore((s) => s.cravings);

  async function onToggle<K extends keyof Omit<NotificationPrefs, 'morningTime'>>(key: K, value: boolean) {
    setNotificationPref(key, value);
    if (!plan) return;
    await scheduleAllNotifications({
      prefs: { ...notifications, [key]: value },
      streakStart: new Date(plan.streakStart),
      streakDays: currentStreakDays(new Date(plan.streakStart), new Date()),
      cravings,
    });
  }

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
      await cancelAllQuitVapeNotifications();
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
        <AppText variant="bodyStrong">Notifications</AppText>
        {TOGGLE_ROWS.map(({ key, label }) => (
          <View key={key} style={styles.toggleRow}>
            <AppText variant="body" color="textSecondary">
              {label}
            </AppText>
            <Switch
              value={notifications[key]}
              onValueChange={(v) => void onToggle(key, v)}
              trackColor={{ false: colors.surfaceElevated, true: colors.accentDim }}
              thumbColor={colors.textPrimary}
            />
          </View>
        ))}
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
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  danger: { marginTop: spacing.xl },
});
