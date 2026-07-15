-- QuitVape — Migration 0003: community report-abuse hardening.
--
-- Finding (see REVIEW_FINDINGS.md H4). The community feed auto-hides any post once
-- `report_count >= 3` (RLS `community_posts_select_visible` USING report_count < 3, and
-- the client mirror). Anonymous sign-in (`auth.signInAnonymously()`) is UNLIMITED and
-- requires no email/identity, so an attacker can script three fresh anonymous sessions,
-- call `report_post(target)` from each, and censor ANY post on demand — a real
-- cross-user takedown chain. 0001's per-reporter PK only stops one account inflating the
-- count; it does nothing against N throwaway accounts.
--
-- Fix (defense in depth; the hide threshold itself stays 3 so the mock/UI stay in sync):
--   1. Only reports from ESTABLISHED accounts (auth.users.created_at older than
--      REPORTER_MIN_AGE) count toward the auto-hide `report_count`. Spinning up three
--      brand-new anon accounts to nuke a post "right now" no longer works — the attacker
--      must age accounts for a day each, raising cost and creating a detectable pattern.
--   2. A per-reporter daily cap (REPORTS_PER_DAY) throttles a single automated actor from
--      mass-reporting the whole feed. Over-cap calls are rejected, not silently dropped.
-- Raw reports are still recorded in post_reports either way (audit trail); only the
-- qualifying subset drives visibility.
--
-- Deploy: `supabase db push` after 0002. NEEDS HUMAN: no live Supabase project exists in
-- this environment; review before applying to production. Tune the two constants below to
-- your abuse tolerance.

create or replace function public.report_post(post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  reporter        uuid := auth.uid();
  new_count       integer;
  reports_today   integer;
  -- An account must be at least this old for its reports to count toward auto-hide.
  reporter_min_age constant interval := interval '24 hours';
  -- Max reports one account may file per calendar day (anti mass-report throttle).
  reports_per_day  constant integer  := 30;
begin
  if reporter is null then
    raise exception 'Not authenticated.' using errcode = '42501';
  end if;

  -- Per-reporter daily throttle (counts this reporter's rows across all posts today).
  select count(*) into reports_today
  from public.post_reports
  where reporter_id = reporter
    and created_at >= date_trunc('day', now());
  if reports_today >= reports_per_day then
    raise exception 'Daily report limit reached. Try again tomorrow.' using errcode = 'P0001';
  end if;

  insert into public.post_reports (post_id, reporter_id)
  values (report_post.post_id, reporter)
  on conflict (post_id, reporter_id) do nothing;

  -- Only reports from established accounts move the auto-hide counter. This is the core
  -- mitigation: three accounts created seconds ago cannot hide a post.
  select count(*) into new_count
  from public.post_reports pr
  join auth.users u on u.id = pr.reporter_id
  where pr.post_id = report_post.post_id
    and u.created_at <= now() - reporter_min_age;

  update public.community_posts
  set report_count = new_count
  where id = report_post.post_id;
end;
$$;

revoke all on function public.report_post(uuid) from public;
grant execute on function public.report_post(uuid) to authenticated;
