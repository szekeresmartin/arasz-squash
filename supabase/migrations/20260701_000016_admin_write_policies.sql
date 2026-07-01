-- Give the "authenticated" role (i.e. someone who logged in through the new
-- admin password gate) real, server-enforced write access to the tables the
-- admin panel manages directly. This replaces the old app_state blob as the
-- admin write path. Score submission/approval/reset keep going through the
-- existing SECURITY DEFINER RPCs, which run as the function owner and are
-- unaffected by these RLS policies/grants.

-- The CSV schedule importer already collects a match date/court, but the
-- normalized matches table never had columns for them (only the client-side
-- blob did) -- add them so that data survives the blob's retirement.
alter table public.matches
  add column if not exists match_date date,
  add column if not exists court text;

-- Player "delete" in the admin panel is a soft-delete (active = false) --
-- matches/results reference players with ON DELETE CASCADE, so a real DELETE
-- here would silently wipe that player's entire match/result history. No
-- delete grant is needed.
grant insert, update on public.leagues to authenticated;
grant insert, update on public.players to authenticated;
-- delete is only used by the admin approval tab to remove an ad-hoc/"custom"
-- submission (one with no real scheduled slot) that was rejected or deleted --
-- never for a normally scheduled match, which is only ever reset via the
-- reset_match_submission RPC.
grant insert, update, delete on public.matches to authenticated;
grant insert, update on public.sponsors to authenticated;
grant insert, update on public.seasons to authenticated;

drop policy if exists "Authenticated manage leagues" on public.leagues;
create policy "Authenticated manage leagues"
on public.leagues
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated manage players" on public.players;
create policy "Authenticated manage players"
on public.players
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated manage matches" on public.matches;
create policy "Authenticated manage matches"
on public.matches
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated manage sponsors" on public.sponsors;
create policy "Authenticated manage sponsors"
on public.sponsors
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated manage seasons" on public.seasons;
create policy "Authenticated manage seasons"
on public.seasons
for all
to authenticated
using (true)
with check (true);

-- Public "Eredmény Beküldése" form lets a submitter pick any two players in a
-- league, not only pairs that already have a "planned" scheduled match (e.g.
-- a player added mid-season without a generated schedule row). Today that
-- path only ever mutates the client-side blob and is never persisted to the
-- database at all -- this RPC gives it a real, durable home so retiring the
-- blob doesn't silently drop these submissions.
create or replace function public.submit_custom_match_result(
  p_league_id text,
  p_player1_id text,
  p_player2_id text,
  p_submitted_score_home integer,
  p_submitted_score_away integer,
  p_submitter_name text,
  p_comment text default null
)
returns public.matches
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  existing_match public.matches;
  updated_match public.matches;
  normalized_name text;
  normalized_comment text;
  new_id text;
begin
  if p_league_id is null or btrim(p_league_id) = '' then
    raise exception 'league_id is required';
  end if;

  if p_player1_id is null or p_player2_id is null or p_player1_id = p_player2_id then
    raise exception 'two distinct players are required';
  end if;

  if p_submitter_name is null or btrim(p_submitter_name) = '' then
    raise exception 'submitter_name is required';
  end if;

  if p_submitted_score_home is null or p_submitted_score_away is null then
    raise exception 'submitted score is required';
  end if;

  if p_submitted_score_home < 0
    or p_submitted_score_away < 0
    or p_submitted_score_home > 5
    or p_submitted_score_away > 5
    or p_submitted_score_home + p_submitted_score_away <> 5 then
    raise exception 'submitted score must be a valid 5-set result';
  end if;

  normalized_name := btrim(p_submitter_name);
  normalized_comment := nullif(btrim(coalesce(p_comment, '')), '');

  select *
  into existing_match
  from public.matches
  where league_id = p_league_id
    and least(player1_id, player2_id) = least(p_player1_id, p_player2_id)
    and greatest(player1_id, player2_id) = greatest(p_player1_id, p_player2_id)
  for update;

  if found then
    if existing_match.status in ('submitted', 'approved') then
      raise exception 'match is not available for submission';
    end if;

    update public.matches
    set
      status = 'submitted',
      submission_type = 'custom',
      submitted_score_home = p_submitted_score_home,
      submitted_score_away = p_submitted_score_away,
      submitted_player1_id = p_player1_id,
      submitted_player2_id = p_player2_id,
      submitted_at = now(),
      submitter_name = normalized_name,
      submitter_contact = null,
      comment = normalized_comment,
      updated_at = now()
    where id = existing_match.id
    returning * into updated_match;

    return updated_match;
  end if;

  new_id := 'm_sub_' || p_league_id || '_' || substr(md5(p_player1_id || ':' || p_player2_id || ':' || clock_timestamp()::text), 1, 12);

  insert into public.matches (
    id,
    league_id,
    player1_id,
    player2_id,
    round_number,
    status,
    submission_type,
    submitted_score_home,
    submitted_score_away,
    submitted_player1_id,
    submitted_player2_id,
    submitted_at,
    submitter_name,
    comment
  )
  values (
    new_id,
    p_league_id,
    p_player1_id,
    p_player2_id,
    0,
    'submitted',
    'custom',
    p_submitted_score_home,
    p_submitted_score_away,
    p_player1_id,
    p_player2_id,
    now(),
    normalized_name,
    normalized_comment
  )
  returning * into updated_match;

  return updated_match;
end;
$$;

grant execute on function public.submit_custom_match_result(text, text, text, integer, integer, text, text) to anon, authenticated;

-- Append the new match_date/court columns to the public read view (append-only,
-- see 20260701_000015 for why CREATE OR REPLACE VIEW can't reposition columns).
create or replace view public.public_matches as
select
  id,
  league_id,
  player1_id,
  player2_id,
  round_number,
  source_cell,
  reverse_source_cell,
  status,
  submission_type,
  submitted_score_home,
  submitted_score_away,
  submitted_at,
  approved_at,
  created_at,
  updated_at,
  submitted_by,
  submitter_name,
  submitter_contact,
  comment,
  approved_by,
  submitted_player1_id,
  submitted_player2_id,
  match_date,
  court
from public.matches;
