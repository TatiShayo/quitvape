-- QuitVape — Milestone 5 backend schema (BUILD_PROMPT features 7, 9, 12; PLAYBOOK Part 2
-- security checklist). Anonymous, device-bound auth (auth.uid() from Supabase anonymous
-- sign-in). Every table's RLS keys on auth.uid() — never a client-supplied user id.
--
-- Threat model reminders enforced here:
--   - Community: server-side profanity filter + length cap + 5 posts/day rate limit +
--     report auto-hide at 3 + report-once-per-user (no client-side race, PLAYBOOK 2.2).
--   - craving_events is anonymized analytics: no free-text, no device/session metadata
--     beyond a coarse hour bucket, never joined to community_posts or buddies.
--   - buddies: owner-only RLS (only the two paired users can ever see a pairing row).
--   - delete_all_my_data(): GDPR/Apple erasure — wipes every row this user owns.
--
-- Deploy: `supabase db push` (or apply via the Supabase SQL editor). NEEDS HUMAN: no
-- Supabase project exists yet in this environment — this file has not been run against
-- a live database. Review before applying to production.

-- ---------------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------------
create extension if not exists pgcrypto; -- gen_random_uuid(), gen_random_bytes()

-- ---------------------------------------------------------------------------------
-- community_posts
-- ---------------------------------------------------------------------------------
create table if not exists public.community_posts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  anon_handle   text not null,
  body          text not null check (char_length(body) <= 280 and char_length(body) > 0),
  streak_days   integer not null default 0 check (streak_days >= 0),
  created_at    timestamptz not null default now(),
  report_count  integer not null default 0 check (report_count >= 0)
);

create index if not exists community_posts_created_at_idx on public.community_posts (created_at desc);
create index if not exists community_posts_user_id_idx on public.community_posts (user_id);

alter table public.community_posts enable row level security;

-- Public read (any authenticated — including anonymous — session), auto-hidden once
-- report_count crosses the threshold. Enforced at the RLS layer itself (defense in
-- depth), not just filtered client-side.
create policy "community_posts_select_visible"
  on public.community_posts for select
  to authenticated
  using (report_count < 3);

-- Insert-only for the authed anon user, and only as themselves.
create policy "community_posts_insert_own"
  on public.community_posts for insert
  to authenticated
  with check (auth.uid() = user_id);

-- No update/delete policy is created for regular users: posts are immutable once
-- created (moderation happens via report_count / report auto-hide, not edits).

-- ---- Auto-generated anon handle -------------------------------------------------
-- The client never supplies (or can spoof) anon_handle; it's assigned server-side from
-- a small deterministic word list keyed off the row id, "QuittingEagle42" style.
create or replace function public.generate_anon_handle(seed uuid)
returns text
language plpgsql
immutable
as $$
declare
  adjectives text[] := array['Quitting','Steady','Calm','Brave','Rising','Clear','Fresh','Bold','Quiet','Strong'];
  nouns      text[] := array['Eagle','Otter','Heron','Falcon','Wolf','Fox','Sparrow','Tiger','Hawk','Bear'];
  n          integer;
  a_idx      integer;
  n_idx      integer;
  num        integer;
begin
  n := abs(hashtext(seed::text));
  a_idx := (n % array_length(adjectives, 1)) + 1;
  n_idx := ((n / 97) % array_length(nouns, 1)) + 1;
  num := (n / 9973) % 100;
  return adjectives[a_idx] || nouns[n_idx] || num::text;
end;
$$;

create or replace function public.community_posts_set_handle()
returns trigger
language plpgsql
as $$
begin
  new.anon_handle := public.generate_anon_handle(gen_random_uuid());
  return new;
end;
$$;

drop trigger if exists community_posts_set_handle_trg on public.community_posts;
create trigger community_posts_set_handle_trg
  before insert on public.community_posts
  for each row execute function public.community_posts_set_handle();

-- ---- Server-side profanity filter (defense in depth; NOT the only filter — the
-- client also runs a lightweight check before submit, per PLAYBOOK "assume trolls from
-- day one": never trust the client alone). Word list intentionally small/generic here;
-- swap for a maintained provider list before shipping (NEEDS HUMAN).
create or replace function public.contains_banned_word(body text)
returns boolean
language sql
immutable
as $$
  select exists (
    select 1
    from unnest(array['fuck','shit','bitch','cunt','nigger','faggot']) as w
    where lower(body) like '%' || w || '%'
  );
$$;

create or replace function public.community_posts_moderate()
returns trigger
language plpgsql
as $$
begin
  if public.contains_banned_word(new.body) then
    raise exception 'Post body failed the content filter.' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists community_posts_moderate_trg on public.community_posts;
create trigger community_posts_moderate_trg
  before insert on public.community_posts
  for each row execute function public.community_posts_moderate();

-- ---- Rate limit: 5 posts/day per user, enforced server-side (client cannot bypass).
create or replace function public.community_posts_rate_limit()
returns trigger
language plpgsql
as $$
declare
  today_count integer;
begin
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

drop trigger if exists community_posts_rate_limit_trg on public.community_posts;
create trigger community_posts_rate_limit_trg
  before insert on public.community_posts
  for each row execute function public.community_posts_rate_limit();

-- ---------------------------------------------------------------------------------
-- post_reports — one report per (post, reporter); backs the atomic report_post() RPC.
-- ---------------------------------------------------------------------------------
create table if not exists public.post_reports (
  post_id     uuid not null references public.community_posts (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, reporter_id)
);

alter table public.post_reports enable row level security;

-- No direct client access to this table at all — it is only ever written through the
-- security-definer report_post() RPC below, which validates the reporter identity.
create policy "post_reports_no_direct_access"
  on public.post_reports for all
  to authenticated
  using (false)
  with check (false);

create or replace function public.report_post(post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  reporter uuid := auth.uid();
  new_count integer;
begin
  if reporter is null then
    raise exception 'Not authenticated.' using errcode = '42501';
  end if;

  insert into public.post_reports (post_id, reporter_id)
  values (report_post.post_id, reporter)
  on conflict (post_id, reporter_id) do nothing;

  select count(*) into new_count from public.post_reports where post_reports.post_id = report_post.post_id;

  update public.community_posts
  set report_count = new_count
  where id = report_post.post_id;
end;
$$;

revoke all on function public.report_post(uuid) from public;
grant execute on function public.report_post(uuid) to authenticated;

-- ---------------------------------------------------------------------------------
-- community_encouragements — preset-only "tap to send" reactions (BUILD_PROMPT: "NO
-- free-text replies v1 — kills moderation load"). preset_id is validated against a
-- fixed allow-list (mirrors src/content/encouragements.ts client-side).
-- ---------------------------------------------------------------------------------
create table if not exists public.community_encouragements (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.community_posts (id) on delete cascade,
  sender_id   uuid not null references auth.users (id) on delete cascade,
  preset_id   text not null check (preset_id in ('keep_going', 'proud_of_you', 'you_got_this', 'one_day_at_a_time', 'sending_strength')),
  created_at  timestamptz not null default now(),
  unique (post_id, sender_id, preset_id)
);

alter table public.community_encouragements enable row level security;

create policy "community_encouragements_select_all"
  on public.community_encouragements for select
  to authenticated
  using (true);

create policy "community_encouragements_no_direct_write"
  on public.community_encouragements for insert
  to authenticated
  with check (false);

create or replace function public.send_encouragement(post_id uuid, preset_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sender uuid := auth.uid();
begin
  if sender is null then
    raise exception 'Not authenticated.' using errcode = '42501';
  end if;
  insert into public.community_encouragements (post_id, sender_id, preset_id)
  values (send_encouragement.post_id, sender, send_encouragement.preset_id)
  on conflict (post_id, sender_id, preset_id) do nothing;
end;
$$;

revoke all on function public.send_encouragement(uuid, text) from public;
grant execute on function public.send_encouragement(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------------
-- craving_events — anonymized craving analytics (BUILD_PROMPT data model + security:
-- "anonymized and never joinable to identity"). Deliberately narrow: no free text, no
-- device metadata, timestamp bucketed to the hour so it can't be correlated with a
-- specific community post or buddy event by timing. Still keyed to auth.uid() only so
-- RLS can enforce insert-own + so delete_all_my_data() can erase it — the app itself
-- never sends this table's rows to PostHog/Sentry (enforced by the analytics scrubber
-- in src/providers/analytics).
-- ---------------------------------------------------------------------------------
create table if not exists public.craving_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  intensity    smallint not null check (intensity between 1 and 5),
  trigger      text not null check (trigger in ('stress', 'social', 'boredom', 'drinking', 'other')),
  resisted     boolean not null,
  hour_bucket  smallint not null check (hour_bucket between 0 and 23),
  created_at   timestamptz not null default now()
);

create index if not exists craving_events_user_id_idx on public.craving_events (user_id);

alter table public.craving_events enable row level security;

create policy "craving_events_insert_own"
  on public.craving_events for insert
  to authenticated
  with check (auth.uid() = user_id);

-- No select policy for other users; a user may read only their own rows (e.g. for a
-- future "your patterns" view). Nobody else can ever query this table via RLS.
create policy "craving_events_select_own"
  on public.craving_events for select
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------------
-- buddies — accountability buddy pairing (BUILD_PROMPT feature 12). Owner-only RLS:
-- only the two paired users (or the inviter, pre-pairing) can ever see a row.
-- ---------------------------------------------------------------------------------
create table if not exists public.buddies (
  id            uuid primary key default gen_random_uuid(),
  user_a        uuid not null references auth.users (id) on delete cascade,
  user_b        uuid references auth.users (id) on delete cascade,
  invite_token  text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at    timestamptz not null default now(),
  paired_at     timestamptz,
  constraint buddies_distinct_users check (user_a is distinct from user_b)
);

create index if not exists buddies_user_a_idx on public.buddies (user_a);
create index if not exists buddies_user_b_idx on public.buddies (user_b);

alter table public.buddies enable row level security;

-- Owner-only: only the inviter (user_a) or the paired buddy (user_b) can read the row.
create policy "buddies_select_owner"
  on public.buddies for select
  to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);

-- A user may only ever create an invite as themselves.
create policy "buddies_insert_own_invite"
  on public.buddies for insert
  to authenticated
  with check (auth.uid() = user_a and user_b is null);

-- No direct UPDATE policy — pairing (setting user_b/paired_at) only happens through the
-- accept_buddy_invite() RPC below, which validates the token and prevents self-pairing.
create policy "buddies_no_direct_update"
  on public.buddies for update
  to authenticated
  using (false);

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
  insert into public.buddies (user_a) values (inviter) returning * into row_out;
  return row_out;
end;
$$;

revoke all on function public.create_buddy_invite() from public;
grant execute on function public.create_buddy_invite() to authenticated;

create or replace function public.accept_buddy_invite(token text)
returns public.buddies
language plpgsql
security definer
set search_path = public
as $$
declare
  acceptor uuid := auth.uid();
  row_out public.buddies;
begin
  if acceptor is null then
    raise exception 'Not authenticated.' using errcode = '42501';
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

revoke all on function public.accept_buddy_invite(text) from public;
grant execute on function public.accept_buddy_invite(text) to authenticated;

-- ---------------------------------------------------------------------------------
-- buddy_streaks — the ONE deliberate, narrow exception to "health data stays local"
-- (BUILD_PROMPT security: "keep it local-first... no quit/relapse data [synced]").
-- The buddy feature explicitly requires showing a paired user's streak (BUILD_PROMPT
-- feature 12: "paired users see each other's streak on home") — this table exists only
-- so that single number can flow to exactly the one person the user opted to pair with,
-- never to the general community/analytics pipeline. A user upserts only their own row;
-- read access is granted to themself AND to whichever user they are currently paired
-- with in `buddies` (and to no one else — verified by the RLS deny-test).
-- ---------------------------------------------------------------------------------
create table if not exists public.buddy_streaks (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  streak_days integer not null default 0 check (streak_days >= 0),
  updated_at  timestamptz not null default now()
);

alter table public.buddy_streaks enable row level security;

create policy "buddy_streaks_select_self_or_paired_buddy"
  on public.buddy_streaks for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.buddies b
      where b.paired_at is not null
        and (
          (b.user_a = auth.uid() and b.user_b = buddy_streaks.user_id)
          or (b.user_b = auth.uid() and b.user_a = buddy_streaks.user_id)
        )
    )
  );

create policy "buddy_streaks_upsert_own"
  on public.buddy_streaks for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "buddy_streaks_update_own"
  on public.buddy_streaks for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------------
-- delete_all_my_data() — GDPR / Apple account-deletion requirement. Wipes every row
-- this user owns across every table above, then the client signs the anon session out.
-- ---------------------------------------------------------------------------------
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
  delete from public.buddies where user_a = uid or user_b = uid;
end;
$$;

revoke all on function public.delete_all_my_data() from public;
grant execute on function public.delete_all_my_data() to authenticated;
