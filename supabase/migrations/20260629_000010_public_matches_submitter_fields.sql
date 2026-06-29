-- Expose submission metadata through the public_matches read model so the
-- admin approval UI can display the submitter name and any comment.

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
  submitted_by,
  submitter_name,
  submitter_contact,
  comment,
  approved_by,
  created_at,
  updated_at
from public.matches;
