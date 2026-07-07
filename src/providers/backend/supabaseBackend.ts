/**
 * Real Supabase backend. Anonymous, device-bound auth. Reads/writes go through RLS —
 * this client never uses a service-role key. Community reads are public; inserts are
 * restricted to the authed anon user; report_count>=3 auto-hides (enforced server-side
 * in the query + a DB policy/view — see supabase/ migrations in the backend milestone).
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { BackendProvider, CommunityPost } from '../types';

const REPORT_HIDE_THRESHOLD = 3;

interface PostRow {
  id: string;
  anon_handle: string;
  body: string;
  streak_days: number;
  created_at: string;
  report_count: number;
}

function fromRow(r: PostRow): CommunityPost {
  return {
    id: r.id,
    anonHandle: r.anon_handle,
    body: r.body,
    streakDays: r.streak_days,
    createdAt: r.created_at,
    reportCount: r.report_count,
  };
}

export function createSupabaseBackend(client: SupabaseClient): BackendProvider {
  let userId: string | undefined;

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
      return (data as PostRow[]).map(fromRow);
    },
    async createCommunityPost({ body, streakDays }) {
      // Server-side length cap + profanity filter enforced by DB trigger/policy; we cap
      // client-side too as a first line, but never trust the client for the real check.
      const { data, error } = await client
        .from('community_posts')
        .insert({ body: body.slice(0, 280), streak_days: streakDays })
        .select('id, anon_handle, body, streak_days, created_at, report_count')
        .single();
      if (error || !data) throw new Error('Your post could not be shared right now.');
      return fromRow(data as PostRow);
    },
    async reportPost(postId) {
      // Reporting goes through an RPC so the increment is atomic and rate-limited
      // server-side (avoids a client-side read-modify-write race — PLAYBOOK 2.2).
      const { error } = await client.rpc('report_post', { post_id: postId });
      if (error) throw new Error('Could not report this post.');
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
