/**
 * Achievements grid (BUILD_PROMPT feature 8). Evaluates unlocks against current
 * streak/craving/money state on mount + focus, persists newly-unlocked ids, and lets
 * the user re-open any unlocked badge's share card at any time.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { AppText, Button, Card, ShareCard, Screen } from '@/ui';
import { colors, radii, spacing } from '@/theme';
import { useQuitStore } from '@/store';
import { useNow } from '@/app-core/useNow';
import { useShareCard } from '@/app-core/useShareCard';
import { currentStreakDays, liveDuration } from '@/domain/streak';
import { moneySaved } from '@/domain/money';
import { ACHIEVEMENTS, AchievementDef, newlyUnlocked } from '@/domain/achievements';

export default function Achievements() {
  const plan = useQuitStore((s) => s.plan);
  const cravings = useQuitStore((s) => s.cravings);
  const achievementsUnlocked = useQuitStore((s) => s.achievementsUnlocked);
  const unlockAchievement = useQuitStore((s) => s.unlockAchievement);
  const now = useNow(60_000);
  const [selected, setSelected] = useState<AchievementDef | null>(null);
  const cardRef = useRef<View>(null);
  const { share, sharing } = useShareCard(cardRef, 'achievement');

  const streakDays = plan ? currentStreakDays(new Date(plan.streakStart), now) : 0;
  const saved = plan ? moneySaved(plan.vapeCostPerWeek, liveDuration(new Date(plan.streakStart), now).totalMs) : 0;
  const resistedCount = useMemo(() => cravings.filter((c) => c.resisted).length, [cravings]);

  useFocusEffect(
    useCallback(() => {
      if (!plan) return;
      const fresh = newlyUnlocked(
        { streakDays, cravingsResistedCount: resistedCount, moneySaved: saved },
        achievementsUnlocked,
      );
      fresh.forEach(unlockAchievement);
      // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute only on focus/streak change, not every store write
    }, [plan, streakDays, resistedCount, saved]),
  );

  return (
    <Screen scroll>
      <AppText variant="overline" color="accent">
        Achievements
      </AppText>
      <AppText variant="title" style={styles.title}>
        Your milestones
      </AppText>

      <View style={styles.grid}>
        {ACHIEVEMENTS.map((a) => {
          const unlocked = achievementsUnlocked.includes(a.id);
          return (
            <Pressable
              key={a.id}
              disabled={!unlocked}
              onPress={() => setSelected(a)}
              style={styles.gridItem}
            >
              <Card style={unlocked ? styles.badge : styles.badgeLockedCombined}>
                {!unlocked ? <Lock size={16} color={colors.textTertiary} /> : null}
                <AppText
                  variant="bodyStrong"
                  color={unlocked ? 'textPrimary' : 'textTertiary'}
                  center
                  style={styles.badgeTitle}
                >
                  {a.title}
                </AppText>
                <AppText variant="caption" color="textTertiary" center>
                  {unlocked ? a.description : 'Locked'}
                </AppText>
              </Card>
            </Pressable>
          );
        })}
      </View>

      <Modal visible={selected !== null} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.scrim} onPress={() => setSelected(null)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {selected ? (
              <ShareCard
                ref={cardRef}
                kicker="QUITVAPE"
                stat={selected.cardLabel.split(' ')[0]}
                statLabel={selected.cardLabel}
                footer={selected.description}
              />
            ) : null}
            <View style={styles.modalActions}>
              <Button label={sharing ? 'Preparing…' : 'Share'} onPress={share} disabled={sharing} haptic />
              <Button label="Close" onPress={() => setSelected(null)} variant="ghost" />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm, marginBottom: spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridItem: { width: '47%' },
  badge: { alignItems: 'center', gap: spacing.xs, minHeight: 120, justifyContent: 'center' },
  badgeLockedCombined: {
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 120,
    justifyContent: 'center',
    opacity: 0.5,
  },
  badgeTitle: { marginTop: spacing.xs },
  scrim: { flex: 1, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center' },
  modalContent: { alignItems: 'center', gap: spacing.xl, padding: spacing.xl, borderRadius: radii.xl },
  modalActions: { gap: spacing.md, width: 240 },
});
