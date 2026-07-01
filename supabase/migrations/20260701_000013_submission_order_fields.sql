alter table public.matches
  add column if not exists submitted_player1_id text references public.players(id) on delete set null,
  add column if not exists submitted_player2_id text references public.players(id) on delete set null;

create or replace function public.submit_match_result(
  p_match_id text,
  p_submitted_score_home integer,
  p_submitted_score_away integer,
  p_submitter_name text,
  p_submitter_contact text default null,
  p_comment text default null,
  p_submitted_player1_id text default null,
  p_submitted_player2_id text default null
)
returns public.matches
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated_match public.matches;
  normalized_name text;
  normalized_contact text;
  normalized_comment text;
  normalized_player1_id text;
  normalized_player2_id text;
begin
  if p_match_id is null or btrim(p_match_id) = '' then
    raise exception 'match_id is required';
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
  normalized_contact := nullif(btrim(coalesce(p_submitter_contact, '')), '');
  normalized_comment := nullif(btrim(coalesce(p_comment, '')), '');
  normalized_player1_id := nullif(btrim(coalesce(p_submitted_player1_id, '')), '');
  normalized_player2_id := nullif(btrim(coalesce(p_submitted_player2_id, '')), '');

  update public.matches
  set
    status = 'submitted',
    submitted_score_home = p_submitted_score_home,
    submitted_score_away = p_submitted_score_away,
    submitted_player1_id = normalized_player1_id,
    submitted_player2_id = normalized_player2_id,
    submitted_at = now(),
    submitter_name = normalized_name,
    submitter_contact = normalized_contact,
    comment = normalized_comment,
    updated_at = now()
  where id = p_match_id
    and status = 'planned'
  returning * into updated_match;

  if not found then
    if exists (select 1 from public.matches where id = p_match_id) then
      raise exception 'match is not available for submission';
    end if;

    raise exception 'match not found';
  end if;

  return updated_match;
end;
$$;

grant execute on function public.submit_match_result(text, integer, integer, text, text, text, text, text) to anon, authenticated;

create or replace function public.approve_match_result(
  p_match_id text,
  p_final_score_home integer default null,
  p_final_score_away integer default null
)
returns public.matches
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated_match public.matches;
  approved_home integer;
  approved_away integer;
  source_sheet_name text;
  source_cells_value text[];
  approved_player1_id text;
  approved_player2_id text;
begin
  if p_match_id is null or btrim(p_match_id) = '' then
    raise exception 'match_id is required';
  end if;

  select *
  into updated_match
  from public.matches
  where id = p_match_id
  for update;

  if not found then
    raise exception 'match not found';
  end if;

  approved_home := coalesce(p_final_score_home, updated_match.submitted_score_home);
  approved_away := coalesce(p_final_score_away, updated_match.submitted_score_away);

  if approved_home is null or approved_away is null then
    raise exception 'approved score is required';
  end if;

  if approved_home < 0
    or approved_away < 0
    or approved_home > 5
    or approved_away > 5
    or approved_home + approved_away <> 5 then
    raise exception 'approved score must be a valid 5-set result';
  end if;

  if updated_match.status = 'rejected' then
    raise exception 'match is not available for approval';
  end if;

  source_sheet_name := case
    when updated_match.submission_type = 'custom' then 'Kézi beküldés'
    else 'Webes beküldés'
  end;

  source_cells_value := array_remove(array[updated_match.source_cell, updated_match.reverse_source_cell], null);
  approved_player1_id := coalesce(updated_match.submitted_player1_id, updated_match.player1_id);
  approved_player2_id := coalesce(updated_match.submitted_player2_id, updated_match.player2_id);

  update public.matches
  set
    status = 'approved',
    submitted_score_home = approved_home,
    submitted_score_away = approved_away,
    approved_at = now(),
    approved_by = null,
    updated_at = now()
  where id = p_match_id
  returning * into updated_match;

  insert into public.results (
    id,
    league_id,
    match_id,
    player1_id,
    player2_id,
    source_sheet,
    source_cells,
    raw_home_token,
    raw_away_token,
    normalized_sets_won,
    normalized_sets_lost,
    kind,
    status,
    played_on_court,
    is_forfeit,
    imported_at,
    submitted_at,
    approved_at,
    source,
    source_reference,
    normalized_token
  )
  values (
    'r_' || updated_match.id,
    updated_match.league_id,
    updated_match.id,
    approved_player1_id,
    approved_player2_id,
    source_sheet_name,
    coalesce(source_cells_value, '{}'::text[]),
    approved_home::text,
    approved_away::text,
    approved_home,
    approved_away,
    'score',
    'approved',
    true,
    false,
    coalesce(updated_match.submitted_at, now()),
    updated_match.submitted_at,
    now(),
    case when updated_match.submission_type = 'custom' then 'web' else 'submission' end,
    null,
    approved_home::text || ':' || approved_away::text
  )
  on conflict (match_id) do update
  set
    league_id = excluded.league_id,
    player1_id = excluded.player1_id,
    player2_id = excluded.player2_id,
    source_sheet = excluded.source_sheet,
    source_cells = excluded.source_cells,
    raw_home_token = excluded.raw_home_token,
    raw_away_token = excluded.raw_away_token,
    normalized_sets_won = excluded.normalized_sets_won,
    normalized_sets_lost = excluded.normalized_sets_lost,
    kind = excluded.kind,
    status = excluded.status,
    played_on_court = excluded.played_on_court,
    is_forfeit = excluded.is_forfeit,
    imported_at = excluded.imported_at,
    submitted_at = excluded.submitted_at,
    approved_at = excluded.approved_at,
    source = excluded.source,
    source_reference = excluded.source_reference,
    normalized_token = excluded.normalized_token,
    updated_at = now();

  return updated_match;
end;
$$;

grant execute on function public.approve_match_result(text, integer, integer) to anon, authenticated;

create or replace view public.public_matches as
select
  id,
  league_id,
  player1_id,
  player2_id,
  submitted_player1_id,
  submitted_player2_id,
  round_number,
  source_cell,
  reverse_source_cell,
  status,
  submission_type,
  submitted_score_home,
  submitted_score_away,
  submitted_at,
  approved_at,
  submitted_by,
  submitter_name,
  submitter_contact,
  comment,
  approved_by,
  created_at,
  updated_at
from public.matches;
