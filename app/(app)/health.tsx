/**
 * Health timeline: science-based recovery milestones, unlocked/locked against the
 * current streak. Tapping "sources" opens the citations behind the copy.
 *
 * WHY IT IS DRAWN AS A SPINE
 * This content is genuinely ordinal — 20 minutes, then 12 hours, then 2 weeks, in a
 * fixed biological order the user cannot skip. A connecting rule with a filled portion
 * is therefore honest structure, not decoration: it shows how far into the sequence the
 * body actually is. (The same device on an unordered list would be a lie about the
 * content, which is why nothing else in this app uses it.)
 *
 * WHY LOCKED ITEMS STAY VISIBLE
 * Seeing what is coming is the motivating part. Hiding future milestones would remove
 * the only forward-looking reward this screen offers, and the goal-gradient pull only
 * works if the user can see the goal.
 */
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Check, Lock } from 'lucide-react-native';
import { AppText, Card, Screen } from '@/ui';
import { colors, radii, skyAt, skyProgress, spacing } from '@/theme';
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

  const sky = useMemo(() => skyAt(skyProgress(streakDays)), [streakDays]);
  const unlockedCount = HEALTH_MILESTONES.filter((m) => streakDays >= m.unlocksAtDay).length;

  return (
    <Screen scroll sky={sky}>
      <AppText variant="overline" color="textTertiary">
        Your body
      </AppText>
      <AppText variant="displayM" style={styles.title}>
        What has already changed
      </AppText>
      <AppText variant="bodyL" color="textSecondary" style={styles.intro}>
        {unlockedCount} of {HEALTH_MILESTONES.length} recovery milestones reached so far.
      </AppText>

      <View style={styles.list}>
        {HEALTH_MILESTONES.map((m, i) => {
          const unlocked = streakDays >= m.unlocksAtDay;
          const isLast = i === HEALTH_MILESTONES.length - 1;
          return (
            <View key={m.id} style={styles.row}>
              {/* The spine: a node per milestone, connected downward. */}
              <View style={styles.spine}>
                <View style={[styles.node, unlocked && styles.nodeUnlocked]}>
                  {unlocked ? (
                    <Check size={11} color={colors.textInverse} strokeWidth={3} />
                  ) : null}
                </View>
                {!isLast ? (
                  <View style={[styles.connector, unlocked && styles.connectorUnlocked]} />
                ) : null}
              </View>

              <Card style={[styles.card, !unlocked && styles.cardLocked]}>
                <View style={styles.cardHeader}>
                  <AppText variant="overline" color={unlocked ? 'accent' : 'textTertiary'}>
                    {m.timeLabel}
                  </AppText>
                  {!unlocked ? <Lock size={13} color={colors.textTertiary} /> : null}
                </View>
                <AppText variant="bodyStrong" color={unlocked ? 'textPrimary' : 'textTertiary'}>
                  {m.title}
                </AppText>
                <AppText
                  variant="body"
                  color={unlocked ? 'textSecondary' : 'textTertiary'}
                  style={styles.body}
                >
                  {unlocked ? m.body : `Unlocks at ${m.timeLabel} vape-free.`}
                </AppText>
                {unlocked ? (
                  <Pressable onPress={() => setSourcesFor(m)} hitSlop={10}>
                    <AppText variant="caption" color="accentDim" style={styles.sourcesLink}>
                      Sources
                    </AppText>
                  </Pressable>
                ) : null}
              </Card>
            </View>
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
            <View style={styles.modalGrabber} />
            <AppText variant="overline" color="textTertiary">
              Where this comes from
            </AppText>
            <AppText variant="title" style={styles.modalTitle}>
              {sourcesFor?.title}
            </AppText>
            {sourcesFor?.sources.map((s) => (
              <AppText key={s} variant="caption" color="textSecondary" style={styles.modalSource}>
                {s}
              </AppText>
            ))}
            <Pressable onPress={() => setSourcesFor(null)} hitSlop={10} style={styles.modalClose}>
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

const NODE = 20;

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm },
  intro: { marginTop: spacing.sm, marginBottom: spacing.xxl },
  list: { gap: 0 },
  row: { flexDirection: 'row', gap: spacing.lg },
  spine: { alignItems: 'center', width: NODE },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  nodeUnlocked: { backgroundColor: colors.accent, borderColor: colors.accent },
  connector: { flex: 1, width: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  connectorUnlocked: { backgroundColor: colors.accentDim },
  card: { flex: 1, gap: spacing.xs, marginBottom: spacing.md },
  cardLocked: { opacity: 0.5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  body: { marginTop: spacing.xs },
  sourcesLink: { marginTop: spacing.sm, textDecorationLine: 'underline' },
  disclaimer: { marginTop: spacing.xl, marginBottom: spacing.md },
  modalScrim: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  modalCard: {
    // Opaque on purpose — a translucent sheet over a scrim washes out to mud.
    backgroundColor: '#141A2E',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderStrong,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  modalGrabber: {
    width: 36,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: { marginBottom: spacing.sm },
  modalSource: { lineHeight: 20 },
  modalClose: { marginTop: spacing.lg, alignSelf: 'center' },
});
