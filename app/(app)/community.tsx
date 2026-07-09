import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText, Button, Card, Screen } from '@/ui';
import { colors, radii, spacing } from '@/theme';
import { AnalyticsEvent, getAnalytics, getBackend } from '@/providers';
import { CommunityPost } from '@/providers/types';
import { ENCOURAGEMENT_PRESETS, EncouragementPresetId } from '@/content/encouragements';
import { COMMUNITY_POST_MAX_LENGTH, validateCommunityPost } from '@/domain/profanity';
import { useQuitStore } from '@/store';
import { useNow } from '@/app-core/useNow';
import { currentStreakDays } from '@/domain/streak';

const VALIDATION_COPY: Record<string, string> = {
  empty: 'Write something before sharing.',
  too_long: `Keep it under ${COMMUNITY_POST_MAX_LENGTH} characters.`,
  banned_word: "Let's keep this space supportive — please revise your wording.",
};

/**
 * Community feed (BUILD_PROMPT feature 7): auto-generated anonymous handles, a post
 * composer with a client-side first-line profanity/length check (the server trigger in
 * `supabase/migrations/0001_init.sql` is authoritative), preset-only "tap to send"
 * encouragements (no free-text replies v1, per BUILD_PROMPT), and a report button.
 * Works fully against the mock backend when Supabase is unconfigured.
 */
export default function Community() {
  const plan = useQuitStore((s) => s.plan);
  const now = useNow(60_000);
  const streakDays = plan ? currentStreakDays(new Date(plan.streakStart), now) : 0;

  const [posts, setPosts] = useState<CommunityPost[] | null>(null);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [sentEncouragements, setSentEncouragements] = useState<Set<string>>(new Set());

  const refresh = useCallback(() => {
    void getBackend().listCommunityPosts().then(setPosts).catch(() => setPosts([]));
  }, []);

  useEffect(() => {
    void getBackend()
      .ensureAnonSession()
      .then(refresh)
      .catch(() => setPosts([]));
  }, [refresh]);

  const validation = useMemo(() => validateCommunityPost(draft), [draft]);
  const trimmedLength = draft.trim().length;

  async function onPost() {
    if (!validation.valid) {
      if (validation.reason) Alert.alert('Cannot post that', VALIDATION_COPY[validation.reason]);
      return;
    }
    setPosting(true);
    try {
      await getBackend().createCommunityPost({ body: draft.trim(), streakDays });
      getAnalytics().capture(AnalyticsEvent.communityPostCreated);
      setDraft('');
      refresh();
    } catch {
      Alert.alert('Could not post', 'Please check your connection and try again.');
    } finally {
      setPosting(false);
    }
  }

  function onReport(postId: string) {
    Alert.alert(
      'Report this post',
      'Reported posts are automatically hidden once enough people flag them.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            void getBackend()
              .reportPost(postId)
              .then(() => {
                getAnalytics().capture(AnalyticsEvent.communityPostReported);
                refresh();
              })
              .catch(() => Alert.alert('Could not report this post', 'Please try again.'));
          },
        },
      ],
    );
  }

  function onEncourage(postId: string, presetId: EncouragementPresetId) {
    const key = `${postId}:${presetId}`;
    if (sentEncouragements.has(key)) return;
    setSentEncouragements((prev) => new Set(prev).add(key));
    void getBackend()
      .sendEncouragement(postId, presetId)
      .then(() => {
        getAnalytics().capture(AnalyticsEvent.communityEncouragementSent);
        refresh();
      })
      .catch(() => {
        // Roll back the optimistic "sent" state so the user can retry.
        setSentEncouragements((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      });
  }

  return (
    <Screen bleed>
      <View style={styles.header}>
        <AppText variant="overline" color="accent">
          Community
        </AppText>
        <AppText variant="title">You&apos;re not quitting alone</AppText>
      </View>

      <Card style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Share a win or a struggle…"
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={COMMUNITY_POST_MAX_LENGTH + 40}
          style={styles.input}
          accessibilityLabel="Write a community post"
        />
        <View style={styles.composerFooter}>
          <AppText
            variant="caption"
            color={trimmedLength > COMMUNITY_POST_MAX_LENGTH ? 'danger' : 'textTertiary'}
            tabular
          >
            {trimmedLength}/{COMMUNITY_POST_MAX_LENGTH}
          </AppText>
          <Button label="Post" onPress={() => void onPost()} disabled={!validation.valid || posting} />
        </View>
      </Card>

      <FlatList
        data={posts ?? []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <AppText variant="body" color="textTertiary" center style={styles.empty}>
            {posts === null ? 'Loading…' : 'Be the first to share a win today.'}
          </AppText>
        }
        renderItem={({ item }) => (
          <Card style={styles.post}>
            <View style={styles.postHeader}>
              <AppText variant="label" color="accent">
                {item.anonHandle}
              </AppText>
              <View style={styles.postHeaderRight}>
                <AppText variant="caption" color="textTertiary" tabular>
                  {item.streakDays}d
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Report this post"
                  onPress={() => onReport(item.id)}
                  hitSlop={8}
                >
                  <AppText variant="caption" color="textTertiary" style={styles.reportLink}>
                    Report
                  </AppText>
                </Pressable>
              </View>
            </View>
            <AppText variant="body">{item.body}</AppText>
            <View style={styles.presetRow}>
              {ENCOURAGEMENT_PRESETS.map((preset) => {
                const sent = sentEncouragements.has(`${item.id}:${preset.id}`);
                const count = item.encouragements[preset.id] ?? 0;
                return (
                  <Pressable
                    key={preset.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Send "${preset.label}"`}
                    onPress={() => onEncourage(item.id, preset.id)}
                    disabled={sent}
                    style={[styles.chip, sent && styles.chipSent]}
                  >
                    <AppText variant="caption" color={sent ? 'accent' : 'textSecondary'}>
                      {preset.label}
                      {count > 0 ? ` · ${count}` : ''}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, gap: spacing.xs, marginBottom: spacing.md },
  composer: { marginHorizontal: spacing.xl, marginBottom: spacing.lg, gap: spacing.sm },
  input: {
    color: colors.textPrimary,
    fontSize: 15,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  composerFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  list: { paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxl },
  post: { gap: spacing.sm },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  postHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reportLink: { textDecorationLine: 'underline' },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  chipSent: { borderColor: colors.accentDim },
  empty: { marginTop: spacing.huge },
});
