-- QuitVape — RLS deny-test + report-abuse regression (PLAYBOOK 2.2 / DoD:
-- "write a test that verifies an anonymous client cannot read another user's rows").
--
-- Runs against a LIVE Supabase project (local `supabase start` or a staging DB) — RLS
-- cannot be exercised in the JS sandbox. The provider-level equivalent that CAN run in
-- CI lives in src/providers/backend/__tests__/mockBackend.isolation.test.ts.
--
-- Usage:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/0001_init.sql
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/0002_security_hardening.sql
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/0003_report_abuse_hardening.sql
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_deny_test.sql
-- Every `assert` below raises and aborts the transaction on failure. The whole script
-- runs in one transaction and rolls back at the end so it leaves no test rows behind.
--
-- NEEDS HUMAN: execute against a real database as part of the release gate.

begin;

-- Helper: run a block as a given user id with the `authenticated` role and a JWT claim
-- so auth.uid() resolves to that user (mirrors how PostgREST sets the request context).
create or replace function pg_temp.as_user(uid uuid) returns void
language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
end; $$;

create or replace function pg_temp.as_postgres() returns void
language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end; $$;

-- Seed three users. For report-abuse coverage, two are "fresh" (created now) and one is
-- "established" (created >24h ago) — mirrors migration 0003's reporter-age gate.
perform pg_temp.as_postgres();
insert into auth.users (id, created_at)
  values ('00000000-0000-0000-0000-00000000000a', now()) on conflict do nothing;
insert into auth.users (id, created_at)
  values ('00000000-0000-0000-0000-00000000000b', now()) on conflict do nothing;
insert into auth.users (id, created_at)
  values ('00000000-0000-0000-0000-00000000000c', now() - interval '3 days') on conflict do nothing;

-- --- 1. craving_events: user B cannot read user A's rows -------------------------
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
insert into public.craving_events (user_id, intensity, trigger, resisted, hour_bucket)
  values ('00000000-0000-0000-0000-00000000000a', 3, 'stress', true, 21);

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
do $$
begin
  assert (select count(*) from public.craving_events) = 0,
    'DENY-TEST FAILED: user B can read user A craving_events';
end $$;

-- --- 2. buddy_streaks: only the paired buddy can read the streak ------------------
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
insert into public.buddy_streaks (user_id, streak_days) values ('00000000-0000-0000-0000-00000000000a', 12);

-- Unpaired user B sees nothing.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
do $$
begin
  assert (select count(*) from public.buddy_streaks
          where user_id = '00000000-0000-0000-0000-00000000000a') = 0,
    'DENY-TEST FAILED: unpaired user B can read user A buddy_streaks';
end $$;

-- --- 3. report-abuse (migration 0003): fresh accounts cannot hide a post ----------
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
insert into public.community_posts (id, user_id, anon_handle, body)
  values ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000000a', 'seed', 'a normal supportive post');

-- Two FRESH accounts (a, b) report it. Under the age gate their reports must NOT count
-- toward report_count, so the post stays visible (report_count = 0).
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select public.report_post('00000000-0000-0000-0000-0000000000f1');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select public.report_post('00000000-0000-0000-0000-0000000000f1');
do $$
begin
  assert (select report_count from public.community_posts
          where id = '00000000-0000-0000-0000-0000000000f1') = 0,
    'ABUSE-TEST FAILED: fresh throwaway accounts inflated report_count (censorship chain open)';
end $$;

-- The ESTABLISHED account (c, aged 3 days) reporting DOES count.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select public.report_post('00000000-0000-0000-0000-0000000000f1');
do $$
begin
  assert (select report_count from public.community_posts
          where id = '00000000-0000-0000-0000-0000000000f1') = 1,
    'ABUSE-TEST FAILED: established account report did not count';
end $$;

rollback;
