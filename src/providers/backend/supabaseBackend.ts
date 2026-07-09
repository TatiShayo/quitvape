/**
 * Real Supabase backend. Anonymous, device-bound auth. Reads/writes go through RLS —
 * this client never uses a service-role key. Community reads are public; inserts are
 * restricted to the authed anon user; report_count>=3 auto-hides (enforced server-side
 * in the query + a DB policy/view — see supabase/migrations/0001_init.sql).
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { BackendProvider, BuddyInfo, CommunityPost } from '../types';
import { EncouragementPresetId } from '@/content/encouragements';

const REPORT_HIDE_THRESHOLD = 3;

interface PostRow {
  id: string;
  anon_handle: string;
  body: string;
  streak_days: number;
  created_at: string;
  report_count: number;
}

interface BuddyRow {
  id: string;
  user_a: string;
  user_b: string | null;
  invite_token: string;
  paired_at: string | null;
}

function fromRow(r: PostRow): CommunityPost {
  return {
    id: r.id,
    anonHandle: r.anon_handle,
    body: r.body,
    streakDays: r.streak_days,
    createdAt: r.created_at,
    reportCount: r.report_count,
    encouragements: {},
  };
}

export function createSupabaseBackend(client: SupabaseClient): BackendProvider {
  let userId: string | undefined;

  async function buddyRowToInfo(row: BuddyRow): Promise<BuddyInfo> {
    const paired = Boolean(row.user_b && row.paired_at);
    const buddyId = row.user_a === userId ? row.user_b : row.user_a;
    let buddyAnonHandle: string | undefined;
    let buddyStreakDays: number | undefined;
    if (paired && buddyId) {
      // buddy_streaks RLS grants read access to exactly the paired buddy — nobody else
      // can ever see this row (verified by the deny-test).
      const { data } = await client
        .from('buddy_streaks')
        .select('streak_days')
        .eq('user_id', buddyId)
        .maybeSingle();
      buddyStreakDays = (data as { streak_days: number } | null)?.streak_days ?? 0;
      buddyAnonHandle = 'Your buddy';
    }
    return {
      id: row.id,
      paired,
      inviteToken: paired ? undefined : row.invite_token,
      buddyAnonHandle,
      buddyStreakDays,
      pairedAt: row.paired_at ?? undefined,
    };
  }

  return {
    async ensureAnonSession() {
      const { data } = await client.auth.getSession();
      if (data.session?.user) {
        userId = data.session.user.id;
        return userId;
      }
      const { data: signed, error } = await client.auth.signInAnonymously();
      if (error || !signed.user) {
        throw new Error('Could not start an anonymous session.');
      }
      userId = signed.user.id;
      return userId;
    },
    getCurrentUserId() {
      return userId;
    },
    async listCommunityPosts(limit = 50) {
      const { data, error } = await client
        .from('community_posts')
        .select('id, anon_handle, body, streak_days, created_at, report_count')
        .lt('report_count', REPORT_HIDE_THRESHOLD)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw new Error('Could not load the community feed.');
      const posts = (data as PostRow[]).map(fromRow);
      if (posts.length === 0) return posts;

      // Encouragement counts are a small secondary query rather than a join so the
      // primary feed query stays a straightforward RLS-filtered select; at scale this
      // becomes a materialized view (NEEDS HUMAN: revisit once the feed has real load).
      const { data: encRows } = await client
        .from('community_encouragements')
        .select('post_id, preset_id')
        .in('post_id', posts.map((p) => p.id));
      if (encRows) {
        const byPost = new Map<string, Partial<Record<EncouragementPresetId, number>>>();
        for (const row of encRows as { post_id: string; preset_id: EncouragementPresetId }[]) {
          const bucket = byPost.get(row.post_id) ?? {};
          bucket[row.preset_id] = (bucket[row.preset_id] ?? 0) + 1;
          byPost.set(row.post_id, bucket);
        }
        for (const post of posts) post.encouragements = byPost.get(post.id) ?? {};
      }
      return posts;
    },
    async createCommunityPost({ body, streakDays }) {
      // Server-side length cap + profanity filter + 5/day rate limit enforced by DB
      // triggers; we cap client-side too as a first line, but never trust the client
      // for the real check (PLAYBOOK "assume trolls from day one").
      const { data, error } = await client
        .from('community_posts')
        .insert({ body: body.slice(0, 280), streak_days: streakDays })
        .select('id, anon_handle, body, streak_days, created_at, report_count')
        .single();
      if (error || !data) throw new Error('Your post could not be shared right now.');
      return fromRow(data as PostRow);
    },
    async reportPost(postId) {
      // Reporting goes through an RPC so the increment is atomic and de-duplicated
      // per-reporter server-side (avoids a client-side read-modify-write race —
      // PLAYBOOK 2.2).
      const { error } = await client.rpc('report_post', { post_id: postId });
      if (error) throw new Error('Could not report this post.');
    },
    async sendEncouragement(postId, presetId) {
      const { error } = await client.rpc('send_encouragement', { post_id: postId, preset_id: presetId });
      if (error) throw new Error('Could not send that right now.');
    },
    async getBuddy() {
      if (!userId) return null;
      const { data, error } = await client
        .from('buddies')
        .select('id, user_a, user_b, invite_token, paired_at')
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .maybeSingle();
      if (error || !data) return null;
      return buddyRowToInfo(data as BuddyRow);
    },
    async createBuddyInvite() {
      const { data, error } = await client.rpc('create_buddy_invite');
      if (error || !data) throw new Error('Could not create an invite right now.');
      return buddyRowToInfo(data as BuddyRow);
    },
    async acceptBuddyInvite(token) {
      const { data, error } = await client.rpc('accept_buddy_invite', { token });
      if (error || !data) throw new Error('That invite is invalid, already used, or has expired.');
      return buddyRowToInfo(data as BuddyRow);
    },
    async sendBuddyEncouragement(buddyId, presetId) {
      const { error } = await client.rpc('send_buddy_encouragement', { buddy_id: buddyId, preset_id: presetId });
      if (error) throw new Error('Could not send that right now.');
    },
    async syncMyStreak(streakDays) {
      if (!userId) return;
      // Own-row upsert only; RLS forbids writing anyone else's streak.
      await client.from('buddy_streaks').upsert({
        user_id: userId,
        streak_days: streakDays,
        updated_at: new Date().toISOString(),
      });
    },
    async deleteAllUserData() {
      // Server-side RPC wipes all rows owned by auth.uid() and revokes the session.
      const { error } = await client.rpc('delete_all_my_data');
      if (error) throw new Error('Could not delete your data. Please try again.');
      await client.auth.signOut();
      userId = undefined;
    },
    isMock: false,
  };
}
