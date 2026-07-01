-- Backward-compatible wrapper for clients that still call the 7-parameter RPC.
-- The latest RPC also accepts submitter contact, but the live app currently
-- sends the older shape. Keep both working until all deploys are updated.

create or replace function public.submit_match_result(
  p_match_id text,
  p_submitted_score_home integer,
  p_submitted_score_away integer,
  p_submitter_name text,
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
    submitter_contact = null,
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

grant execute on function public.submit_match_result(text, integer, integer, text, text, text, text) to anon, authenticated;
