import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadCommunityFeedCache, saveCommunityFeedCache } from '../communityCache';
import { CommunityPost } from '@/providers/types';

describe('communityCache', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns null when no cache exists', async () => {
    const result = await loadCommunityFeedCache();
    expect(result).toBeNull();
  });

  it('saves and reloads community posts accurately', async () => {
    const mockPosts: CommunityPost[] = [
      {
        id: 'p1',
        anonHandle: 'QuittingEagle42',
        body: 'Day 5 feeling strong.',
        streakDays: 5,
        createdAt: '2026-08-15T00:00:00.000Z',
        reportCount: 0,
        encouragements: { keep_going: 3 },
      },
    ];

    await saveCommunityFeedCache(mockPosts);
    const loaded = await loadCommunityFeedCache();

    expect(loaded).toEqual(mockPosts);
  });

  it('caps saved posts at MAX_POSTS (50)', async () => {
    const manyPosts: CommunityPost[] = Array.from({ length: 60 }, (_, i) => ({
      id: `p-${i}`,
      anonHandle: `User${i}`,
      body: `Post ${i}`,
      streakDays: i,
      createdAt: new Date().toISOString(),
      reportCount: 0,
      encouragements: {},
    }));

    await saveCommunityFeedCache(manyPosts);
    const loaded = await loadCommunityFeedCache();

    expect(loaded?.length).toBe(50);
  });

  it('handles corrupt JSON in storage gracefully by returning null', async () => {
    await AsyncStorage.setItem('quitvape/community-feed-cache/v1', 'not valid json {{{');
    const result = await loadCommunityFeedCache();
    expect(result).toBeNull();
  });
});
