/**
 * Mock backend. In-memory community feed with realistic seed data (never lorem ipsum,
 * PLAYBOOK 1.5). Used when Supabase is unconfigured so the community/buddy UI is
 * walkable offline. Report auto-hide at 3 mirrors the real RLS/threshold rule.
 *
 * State lives in an explicit `MockBackendStore` rather than module-level globals so
 * tests can simulate multiple independent anon sessions ("devices") talking to the same
 * mock "server" by passing the same store into multiple `createMockBackend()` calls —
 * this is what makes the RLS-equivalent isolation test in
 * `src/providers/backend/__tests__/mockBackend.isolation.test.ts` possible. The real app
 * only ever creates one instance (via `getBackend()`), each with its own private store,
 * so this has no effect on runtime behavior.
 */
import { BackendProvider, BuddyInfo, CommunityPost } from '../types';
import { EncouragementPresetId } from '@/content/encouragements';
import { generateAnonHandle } from '@/domain/anonHandle';

const REPORT_HIDE_THRESHOLD = 3;

interface BuddyRow {
  id: string;
  userA: string;
  userB?: string;
  inviteToken: string;
  createdAt: string;
  pairedAt?: string;
}

export interface MockBackendStore {
  posts: CommunityPost[];
  /** post id -> owning anon user id. Not exposed on CommunityPost (mirrors real RLS: a
   * client never learns another user's id from a post row), only used internally so
   * `deleteAllUserData()` can find *this* session's own posts precisely — even when
   * multiple simulated sessions share a store, as in the isolation test. */
  postOwners: Map<string, string>;
  reportsByPostAndUser: Set<string>;
  buddies: BuddyRow[];
  /** Mirrors the real `buddy_streaks` table: user id -> their own reported streak. */
  streaksByUser: Map<string, number>;
}

function seedPosts(): CommunityPost[] {
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
      encouragements: {},
    },
    {
      id: 'seed-2',
      anonHandle: 'CalmOtter17',
      body: 'Slipped yesterday after two weeks. Starting again today. It still counts.',
      streakDays: 1,
      createdAt: new Date(now - 6 * h).toISOString(),
      reportCount: 0,
      encouragements: {},
    },
    {
      id: 'seed-3',
      anonHandle: 'SteadyHeron88',
      body: 'One month vape-free. Saved $240 and I can taste coffee again.',
      streakDays: 30,
      createdAt: new Date(now - 20 * h).toISOString(),
      reportCount: 0,
      encouragements: {},
    },
  ];
}

/** Fresh, private store — used implicitly whenever a caller doesn't pass a shared one. */
export function createMockBackendStore(): MockBackendStore {
  return {
    posts: seedPosts(),
    postOwners: new Map(),
    reportsByPostAndUser: new Set(),
    buddies: [],
    streaksByUser: new Map(),
  };
}

function toBuddyInfo(row: BuddyRow | undefined, selfId: string, store: MockBackendStore): BuddyInfo | null {
  if (!row) return null;
  const paired = Boolean(row.userB);
  const buddyId = row.userA === selfId ? row.userB : row.userA;
  return {
    id: row.id,
    paired,
    inviteToken: paired ? undefined : row.inviteToken,
    buddyAnonHandle: paired && buddyId ? generateAnonHandle(buddyId) : undefined,
    // Prefers the buddy's real synced streak (mirrors buddy_streaks); falls back to a
    // deterministic demo number so the paired UI is still walkable before either side
    // has called syncMyStreak().
    buddyStreakDays:
      paired && buddyId
        ? (store.streaksByUser.get(buddyId) ?? (Math.abs(hashCode(buddyId)) % 40) + 1)
        : undefined,
    pairedAt: row.pairedAt,
  };
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

let counter = 100;
let inviteCounter = 1000;

export function createMockBackend(store: MockBackendStore = createMockBackendStore()): BackendProvider {
  let userId: string | undefined;

  return {
    async ensureAnonSession() {
      if (!userId) userId = `mock-anon-${Math.random().toString(36).slice(2, 10)}`;
      return userId;
    },
    getCurrentUserId() {
      return userId;
    },
    async listCommunityPosts(limit = 50) {
      return store.posts
        .filter((p) => p.reportCount < REPORT_HIDE_THRESHOLD)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit)
        .map((p) => {
          // "You" is a client-side presentational label for the viewer's own posts only
          // — other sessions must see a real generated handle, never "You".
          const owner = store.postOwners.get(p.id);
          if (p.anonHandle !== 'You') return p;
          return { ...p, anonHandle: owner && owner === userId ? 'You' : generateAnonHandle(owner ?? p.id) };
        });
    },
    async createCommunityPost({ body, streakDays }) {
      if (!userId) throw new Error('Not authenticated.');
      const post: CommunityPost = {
        id: `mock-${counter++}`,
        // The user's own posts are shown as "You" in their own feed view; a real backend
        // assigns a stable server-generated handle other users would see instead.
        anonHandle: 'You',
        body: body.slice(0, 280),
        streakDays,
        createdAt: new Date().toISOString(),
        reportCount: 0,
        encouragements: {},
      };
      store.postOwners.set(post.id, userId);
      store.posts = [post, ...store.posts];
      return post;
    },
    async reportPost(postId) {
      if (!userId) throw new Error('Not authenticated.');
      // Mirrors the real report_post() RPC: one report per (post, reporter), atomic
      // recount rather than a blind increment (PLAYBOOK 2.2).
      const key = `${postId}:${userId}`;
      if (store.reportsByPostAndUser.has(key)) return;
      store.reportsByPostAndUser.add(key);
      const newCount = [...store.reportsByPostAndUser].filter((k) => k.startsWith(`${postId}:`)).length;
      store.posts = store.posts.map((p) => (p.id === postId ? { ...p, reportCount: newCount } : p));
    },
    async sendEncouragement(postId, presetId: EncouragementPresetId) {
      store.posts = store.posts.map((p) => {
        if (p.id !== postId) return p;
        const current = p.encouragements[presetId] ?? 0;
        return { ...p, encouragements: { ...p.encouragements, [presetId]: current + 1 } };
      });
    },
    async getBuddy() {
      if (!userId) return null;
      const row = store.buddies.find((b) => b.userA === userId || b.userB === userId);
      return toBuddyInfo(row, userId, store);
    },
    async createBuddyInvite() {
      if (!userId) throw new Error('Not authenticated.');
      const existing = store.buddies.find((b) => b.userA === userId || b.userB === userId);
      if (existing) return toBuddyInfo(existing, userId, store) as BuddyInfo;
      const row: BuddyRow = {
        id: `mock-buddy-${inviteCounter++}`,
        userA: userId,
        inviteToken: `mock-token-${Math.random().toString(36).slice(2, 10)}`,
        createdAt: new Date().toISOString(),
      };
      store.buddies = [...store.buddies, row];
      return toBuddyInfo(row, userId, store) as BuddyInfo;
    },
    async acceptBuddyInvite(token) {
      if (!userId) throw new Error('Not authenticated.');
      const row = store.buddies.find((b) => b.inviteToken === token && !b.userB);
      if (!row) throw new Error('Invite is invalid, already used, or has expired.');
      if (row.userA === userId) throw new Error('You cannot pair with your own invite.');
      row.userB = userId;
      row.pairedAt = new Date().toISOString();
      store.buddies = store.buddies.map((b) => (b.id === row.id ? row : b));
      return toBuddyInfo(row, userId, store) as BuddyInfo;
    },
    async syncMyStreak(streakDays) {
      if (!userId) return;
      store.streaksByUser.set(userId, streakDays);
    },
    async deleteAllUserData() {
      if (!userId) return;
      const mine = userId;
      store.posts = store.posts.filter((p) => store.postOwners.get(p.id) !== mine);
      for (const [postId, owner] of [...store.postOwners]) {
        if (owner === mine) store.postOwners.delete(postId);
      }
      for (const key of [...store.reportsByPostAndUser]) {
        if (key.endsWith(`:${mine}`)) store.reportsByPostAndUser.delete(key);
      }
      store.buddies = store.buddies.filter((b) => b.userA !== mine && b.userB !== mine);
      store.streaksByUser.delete(mine);
      userId = undefined;
    },
    isMock: true,
  };
}
