/**
 * Offline snapshot of the community feed (perf/reliability: the feed screen renders
 * last-known posts instantly on open and stays useful with no connection, instead of
 * "Loading…" -> empty).
 *
 * Privacy note: the cache holds only what the public feed already shows every user —
 * anonymous handles + post bodies + streak-day badges. None of the local user's own
 * quit/relapse/craving data is written here.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommunityPost } from '@/providers/types';

const KEY = 'quitvape/community-feed-cache/v1';
const MAX_POSTS = 50;

interface CacheEnvelope {
  savedAt: string;
  posts: CommunityPost[];
}

export async function loadCommunityFeedCache(): Promise<CommunityPost[] | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope;
    if (!Array.isArray(parsed.posts)) return null;
    return parsed.posts;
  } catch {
    return null; // Corrupt cache is never fatal — the live fetch is authoritative.
  }
}

export async function saveCommunityFeedCache(posts: CommunityPost[]): Promise<void> {
  try {
    const envelope: CacheEnvelope = {
      savedAt: new Date().toISOString(),
      posts: posts.slice(0, MAX_POSTS),
    };
    await AsyncStorage.setItem(KEY, JSON.stringify(envelope));
  } catch {
    // Best-effort cache; ignore quota/serialization failures.
  }
}
