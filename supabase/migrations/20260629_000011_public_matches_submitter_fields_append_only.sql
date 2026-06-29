-- Keep the existing public_matches column order intact and append the new
-- submission metadata columns at the end so CREATE OR REPLACE VIEW does not
-- attempt to rename/reposition existing columns.

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
  approved_by
from public.matches;
