/**
 * Health timeline (BUILD_PROMPT feature 4): science-based recovery milestones with
 * unlocked/locked state tied to the current streak. Tapping a card's "sources" link
 * opens an info modal citing where the copy came from, per BUILD_PROMPT.
 */
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Lock } from 'lucide-react-native';
import { AppText, Card, Screen } from '@/ui';
import { colors, radii, spacing } from '@/theme';
import { useQuitStore } from '@/store';
import { useNow } from '@/app-core/useNow';
import { currentStreakDays } from '@/domain/streak';
import { HEALTH_MILESTONES, HEALTH_TIMELINE_DISCLAIMER, HealthMilestone } from '@/content/healthTimeline';

export default function HealthTimeline() {
  const plan = useQuitStore((s) => s.plan);
  const now = useNow(60_000);
  const [sourcesFor, setSourcesFor] = useState<HealthMilestone | null>(null);

  const streakDays = useMemo(
    () => (plan ? currentStreakDays(new Date(plan.streakStart), now) : 0),
    [plan, now],
  );

  return (
    <Screen scroll>
      <AppText variant="overline" color="accent">
        Health
      </AppText>
      <AppText variant="title" style={styles.title}>
        Your recovery timeline
      </AppText>
      <AppText variant="body" color="textSecondary" style={styles.intro}>
        What happens in your body as your streak grows.
      </AppText>

      <View style={styles.list}>
        {HEALTH_MILESTONES.map((m) => {
          const unlocked = streakDays >= m.unlocksAtDay;
          return (
            <Card key={m.id} style={[styles.card, !unlocked && styles.cardLocked]}>
              <View style={styles.cardHeader}>
                <AppText variant="overline" color={unlocked ? 'accent' : 'textTertiary'}>
                  {m.timeLabel}
                </AppText>
                {!unlocked ? <Lock size={14} color={colors.textTertiary} /> : null}
              </View>
              <AppText variant="bodyStrong" color={unlocked ? 'textPrimary' : 'textTertiary'}>
                {m.title}
              </AppText>
              <AppText variant="body" color={unlocked ? 'textSecondary' : 'textTertiary'} style={styles.body}>
                {unlocked ? m.body : `Unlocks at ${m.timeLabel} vape-free.`}
              </AppText>
              {unlocked ? (
                <Pressable onPress={() => setSourcesFor(m)} hitSlop={8}>
                  <AppText variant="caption" color="accentDim" style={styles.sourcesLink}>
                    Sources
                  </AppText>
                </Pressable>
              ) : null}
            </Card>
          );
        })}
      </View>

      <AppText variant="caption" color="textTertiary" style={styles.disclaimer}>
        {HEALTH_TIMELINE_DISCLAIMER}
      </AppText>

      <Modal
        visible={sourcesFor !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSourcesFor(null)}
      >
        <Pressable style={styles.modalScrim} onPress={() => setSourcesFor(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <AppText variant="bodyStrong" style={styles.modalTitle}>
              Sources
            </AppText>
            {sourcesFor?.sources.map((s) => (
              <AppText key={s} variant="caption" color="textSecondary" style={styles.modalSource}>
                {s}
              </AppText>
            ))}
            <Pressable onPress={() => setSourcesFor(null)} hitSlop={8} style={styles.modalClose}>
              <AppText variant="label" color="accent">
                Close
              </AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm },
  intro: { marginTop: spacing.xs, marginBottom: spacing.xl },
  list: { gap: spacing.md },
  card: { gap: spacing.xs },
  cardLocked: { opacity: 0.55 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  body: { marginTop: spacing.xs },
  sourcesLink: { marginTop: spacing.sm, textDecorationLine: 'underline' },
  disclaimer: { marginTop: spacing.xl, marginBottom: spacing.md },
  modalScrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  modalTitle: { marginBottom: spacing.xs },
  modalSource: { lineHeight: 20 },
  modalClose: { marginTop: spacing.lg, alignSelf: 'center' },
});
