/**
 * Provider-level RLS-equivalent isolation tests (BUILD_PROMPT security: "write the
 * deny-test proving one anon user can't read another's rows"). We can't run the real
 * Postgres RLS policies in this sandbox (no live Supabase project — see
 * `supabase/tests/rls_deny_test.sql` for the SQL-level version to run against a real
 * database), but `createMockBackend` shares its in-memory `MockBackendStore` the same
 * way multiple devices would share one Supabase project, so two `createMockBackend`
 * instances pointed at the same store behave like two independent anon sessions talking
 * to one backend — a faithful emulation of the RLS boundary for the object shapes the
 * app actually reads.
 */
import { createMockBackend, createMockBackendStore, MockBackendStore } from '../mockBackend';

async function session(store: MockBackendStore) {
  const backend = createMockBackend(store);
  await backend.ensureAnonSession();
  return backend;
}

describe('mock backend session isolation (RLS-equivalent)', () => {
  let store: MockBackendStore;

  beforeEach(() => {
    store = createMockBackendStore();
  });

  it('an unrelated user cannot see another user\'s pending buddy invite', async () => {
    const userA = await session(store);
    const userC = await session(store);

    await userA.createBuddyInvite();

    // userC has no pairing at all yet — owner-only RLS means they see nothing of A's row.
    const cView = await userC.getBuddy();
    expect(cView).toBeNull();
  });

  it('only the two paired users can see the pairing; a third user cannot', async () => {
    const userA = await session(store);
    const userB = await session(store);
    const userC = await session(store);

    const invite = await userA.createBuddyInvite();
    await userB.acceptBuddyInvite(invite.inviteToken!);

    const aView = await userA.getBuddy();
    const bView = await userB.getBuddy();
    const cView = await userC.getBuddy();

    expect(aView?.paired).toBe(true);
    expect(bView?.paired).toBe(true);
    expect(cView).toBeNull();
  });

  it('a user cannot accept their own invite (self-pairing is blocked)', async () => {
    const userA = await session(store);
    const invite = await userA.createBuddyInvite();
    await expect(userA.acceptBuddyInvite(invite.inviteToken!)).rejects.toThrow();
  });

  it("a buddy's streak is only visible once paired, never before", async () => {
    const userA = await session(store);
    const userB = await session(store);
    await userA.syncMyStreak(12);

    const invite = await userA.createBuddyInvite();
    // Before pairing, B has no visibility into A at all.
    expect(await userB.getBuddy()).toBeNull();

    await userB.acceptBuddyInvite(invite.inviteToken!);
    const bView = await userB.getBuddy();
    expect(bView?.buddyStreakDays).toBe(12);
  });

  it("deleteAllUserData wipes only the caller's own community posts, not another user's", async () => {
    const userA = await session(store);
    const userB = await session(store);

    await userA.createCommunityPost({ body: "A's post", streakDays: 3 });
    await userB.createCommunityPost({ body: "B's post", streakDays: 5 });

    await userA.deleteAllUserData();

    const remaining = await userB.listCommunityPosts();
    const bodies = remaining.map((p) => p.body);
    expect(bodies).toContain("B's post");
    expect(bodies).not.toContain("A's post");
  });

  it('deleteAllUserData unpairs a buddy relationship without leaking cross-user state', async () => {
    const userA = await session(store);
    const userB = await session(store);
    const invite = await userA.createBuddyInvite();
    await userB.acceptBuddyInvite(invite.inviteToken!);

    await userA.deleteAllUserData();

    // The pairing row involved A, so it must be gone for B too (real DELETE cascades
    // the same way — the row itself, not just A's view of it, is erased).
    expect(await userB.getBuddy()).toBeNull();
  });

  it('reporting is deduplicated per (post, reporter) — spamming reportPost from the same session does not inflate the count past one', async () => {
    const userA = await session(store);
    const userB = await session(store);
    const post = await userB.createCommunityPost({ body: 'test post', streakDays: 1 });

    await userA.reportPost(post.id);
    await userA.reportPost(post.id);
    await userA.reportPost(post.id);

    const target = (await userB.listCommunityPosts()).find((p) => p.id === post.id);
    expect(target?.reportCount).toBe(1);
  });
});
