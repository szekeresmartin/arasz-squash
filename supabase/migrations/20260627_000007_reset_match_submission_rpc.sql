-- Secure public rollback path for submitted matches.
-- This clears only submission-related fields and returns the match to planned.

create or replace function public.reset_match_submission(
  p_match_id text
)
returns public.matches
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated_match public.matches;
begin
  if p_match_id is null or btrim(p_match_id) = '' then
    raise exception 'match_id is required';
  end if;

  delete from public.results
  where match_id = p_match_id;

  update public.matches
  set
    status = 'planned',
    submitted_score_home = null,
    submitted_score_away = null,
    submitted_at = null,
    submitted_by = null,
    submitter_name = null,
    submitter_contact = null,
    comment = null,
    approved_at = null,
    approved_by = null,
    updated_at = now()
  where id = p_match_id
    and status = 'submitted'
  returning * into updated_match;

  if not found then
    if exists (select 1 from public.matches where id = p_match_id) then
      raise exception 'match is not available for reset';
    end if;

    raise exception 'match not found';
  end if;

  return updated_match;
end;
$$;

grant execute on function public.reset_match_submission(text) to anon, authenticated;
