import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { AppText, Card, Screen } from '@/ui';
import { spacing } from '@/theme';
import { getBackend } from '@/providers';
import { CommunityPost } from '@/providers/types';

export default function Community() {
  const [posts, setPosts] = useState<CommunityPost[] | null>(null);

  useEffect(() => {
    void getBackend().listCommunityPosts().then(setPosts).catch(() => setPosts([]));
  }, []);

  return (
    <Screen bleed>
      <View style={styles.header}>
        <AppText variant="overline" color="accent">
          Community
        </AppText>
        <AppText variant="title">You're not quitting alone</AppText>
      </View>
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
              <AppText variant="caption" color="textTertiary" tabular>
                {item.streakDays}d
              </AppText>
            </View>
            <AppText variant="body">{item.body}</AppText>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, gap: spacing.xs, marginBottom: spacing.md },
  list: { paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxl },
  post: { gap: spacing.sm },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  empty: { marginTop: spacing.huge },
});
