-- QuitVape — Migration 0002: security hardening from the 2026-07-12 review
-- (see REVIEW_FINDINGS.md: C2, H2, M1, M2).
--
-- Deploy: `supabase db push` after 0001_init.sql. NEEDS HUMAN: no live Supabase
-- project exists in this environment; review before applying to production.

-- ---------------------------------------------------------------------------------
-- C2 — coach_messages + atomic daily quota for the coach edge function.
-- Rows are an audit/quota ledger only; clients have NO direct access (the edge
-- function talks to it via service-role through consume_coach_quota()). We store no
-- message content — only that a message was consumed (data minimization, PLAYBOOK 2.7).
-- Retention: rows older than 35 days are purgeable (only "today" is ever queried).
-- ---------------------------------------------------------------------------------
create table if not exists public.coach_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists coach_messages_user_day_idx
  on public.coach_messages (user_id, created_at desc);

alter table public.coach_messages enable row level security;

-- Default-deny: no policies for authenticated users at all. Only the service role
-- (which bypasses RLS) touches this table, via the RPC below.

create or replace function public.consume_coach_quota(p_user_id uuid, p_daily_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  today_count integer;
begin
  if p_user_id is null or p_daily_limit is null or p_daily_limit < 1 then
    return false;
  end if;

  -- Serialize per-user so two concurrent requests cannot both pass the count check.
  perform pg_advisory_xact_lock(hashtext('coach_quota:' || p_user_id::text));

  select count(*) into today_count
  from public.coach_messages
  where user_id = p_user_id
    and created_at >= date_trunc('day', now());

  if today_count >= p_daily_limit then
    return false;
  end if;

  insert into public.coach_messages (user_id) values (p_user_id);
  return true;
end;
$$;

-- Service-role only: not callable by anon/authenticated clients.
revoke all on function public.consume_coach_quota(uuid, integer) from public;
revoke all on function public.consume_coach_quota(uuid, integer) from anon, authenticated;
grant execute on function public.consume_coach_quota(uuid, integer) to service_role;

-- Include the ledger in GDPR erasure.
create or replace function public.delete_all_my_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated.' using errcode = '42501';
  end if;

  delete from public.community_encouragements where sender_id = uid;
  delete from public.post_reports where reporter_id = uid;
  delete from public.community_posts where user_id = uid;
  delete from public.craving_events where user_id = uid;
  delete from public.buddy_streaks where user_id = uid;
  delete from public.buddy_encouragements where sender_id = uid;
  delete from public.buddies where user_a = uid or user_b = uid;
  delete from public.coach_messages where user_id = uid;
end;
$$;

-- ---------------------------------------------------------------------------------
-- H2 — fix the TOCTOU race in the community 5-posts/day rate limit: take a per-user
-- advisory transaction lock before counting, so concurrent inserts serialize.
-- ---------------------------------------------------------------------------------
create or replace function public.community_posts_rate_limit()
returns trigger
language plpgsql
as $$
declare
  today_count integer;
begin
  perform pg_advisory_xact_lock(hashtext('community_posts_rate:' || new.user_id::text));

  select count(*) into today_count
  from public.community_posts
  where user_id = new.user_id
    and created_at >= date_trunc('day', now());
  if today_count >= 5 then
    raise exception 'Daily post limit reached. Try again tomorrow.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------------
-- M1 — craving_events promised hour-bucket anonymization but stored a precise
-- created_at. Coarsen the default to the day (hour_bucket already carries the
-- analytic signal) and truncate existing rows so old data can't be time-correlated.
-- ---------------------------------------------------------------------------------
alter table public.craving_events
  alter column created_at set default date_trunc('day', now());

update public.craving_events set created_at = date_trunc('day', created_at);

-- ---------------------------------------------------------------------------------
-- M2 — enforce the 1:1 buddy model. create_buddy_invite() now returns the caller's
-- existing open-invite/paired row instead of stacking duplicates (which also broke the
-- client's .maybeSingle()); accept_buddy_invite() refuses acceptors already paired.
-- ---------------------------------------------------------------------------------
create or replace function public.create_buddy_invite()
returns public.buddies
language plpgsql
security definer
set search_path = public
as $$
declare
  inviter uuid := auth.uid();
  row_out public.buddies;
begin
  if inviter is null then
    raise exception 'Not authenticated.' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext('buddy_invite:' || inviter::text));

  -- Reuse an existing pairing or open invite instead of creating a duplicate.
  select * into row_out
  from public.buddies
  where user_a = inviter or user_b = inviter
  order by (paired_at is not null) desc, created_at desc
  limit 1;

  if row_out.id is not null then
    return row_out;
  end if;

  insert into public.buddies (user_a) values (inviter) returning * into row_out;
  return row_out;
end;
$$;

create or replace function public.accept_buddy_invite(token text)
returns public.buddies
language plpgsql
security definer
set search_path = public
as $$
declare
  acceptor uuid := auth.uid();
  row_out public.buddies;
  already_paired boolean;
begin
  if acceptor is null then
    raise exception 'Not authenticated.' using errcode = '42501';
  end if;

  select exists (
    select 1 from public.buddies
    where paired_at is not null and (user_a = acceptor or user_b = acceptor)
  ) into already_paired;
  if already_paired then
    raise exception 'You already have a buddy. Unpair first.' using errcode = 'P0001';
  end if;

  update public.buddies
  set user_b = acceptor, paired_at = now()
  where invite_token = accept_buddy_invite.token
    and user_b is null
    and user_a <> acceptor
  returning * into row_out;

  if row_out.id is null then
    raise exception 'Invite is invalid, already used, or is your own invite.' using errcode = 'P0001';
  end if;

  return row_out;
end;
$$;
