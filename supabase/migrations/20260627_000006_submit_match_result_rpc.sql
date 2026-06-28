-- Secure public submission path for planned matches.
-- The function only updates whitelisted fields on public.matches and refuses to
-- overwrite anything that is not still planned.

revoke all privileges on table public.matches from anon, authenticated;

create or replace function public.submit_match_result(
  p_match_id text,
  p_submitted_score_home integer,
  p_submitted_score_away integer,
  p_submitter_name text,
  p_submitter_contact text default null,
  p_comment text default null
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

  update public.matches
  set
    status = 'submitted',
    submitted_score_home = p_submitted_score_home,
    submitted_score_away = p_submitted_score_away,
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

grant execute on function public.submit_match_result(text, integer, integer, text, text, text) to anon, authenticated;
