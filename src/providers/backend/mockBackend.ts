/**
 * Mock backend. In-memory community feed with realistic seed data (never lorem ipsum,
 * PLAYBOOK 1.5). Used when Supabase is unconfigured so the community/buddy UI is
 * walkable offline. Report auto-hide at 3 mirrors the real RLS/threshold rule.
 */
import { BackendProvider, CommunityPost } from '../types';

const REPORT_HIDE_THRESHOLD = 3;

function seed(): CommunityPost[] {
  const now = Date.now();
  const h = 60 * 60 * 1000;
  return [
    {
      id: 'seed-1',
      anonHandle: 'QuittingEagle42',
      body: 'Day 9. The 9pm cravings are the worst but the breathing thing actually works.',
      streakDays: 9,
      createdAt: new Date(now - 2 * h).toISOString(),
      reportCount: 0,
    },
    {
      id: 'seed-2',
      anonHandle: 'CalmOtter17',
      body: 'Slipped yesterday after two weeks. Starting again today. It still counts.',
      streakDays: 1,
      createdAt: new Date(now - 6 * h).toISOString(),
      reportCount: 0,
    },
    {
      id: 'seed-3',
      anonHandle: 'SteadyHeron88',
      body: 'One month vape-free. Saved $240 and I can taste coffee again.',
      streakDays: 30,
      createdAt: new Date(now - 20 * h).toISOString(),
      reportCount: 0,
    },
  ];
}

export function createMockBackend(): BackendProvider {
  let userId: string | undefined;
  let posts = seed();
  let counter = 100;

  return {
    async ensureAnonSession() {
      if (!userId) userId = `mock-anon-${Math.random().toString(36).slice(2, 10)}`;
      return userId;
    },
    getCurrentUserId() {
      return userId;
    },
    async listCommunityPosts(limit = 50) {
      return posts
        .filter((p) => p.reportCount < REPORT_HIDE_THRESHOLD)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit);
    },
    async createCommunityPost({ body, streakDays }) {
      const post: CommunityPost = {
        id: `mock-${counter++}`,
        anonHandle: 'You',
        body: body.slice(0, 280),
        streakDays,
        createdAt: new Date().toISOString(),
        reportCount: 0,
      };
      posts = [post, ...posts];
      return post;
    },
    async reportPost(postId) {
      posts = posts.map((p) =>
        p.id === postId ? { ...p, reportCount: p.reportCount + 1 } : p,
      );
    },
    async deleteAllUserData() {
      posts = posts.filter((p) => p.anonHandle !== 'You');
      userId = undefined;
    },
    isMock: true,
  };
}
