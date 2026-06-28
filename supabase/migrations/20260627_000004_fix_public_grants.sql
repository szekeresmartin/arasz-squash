-- Reset privileges on the normalized read model and public views.
-- This removes any drift introduced by earlier manual grants or SQL editor changes,
-- then restores read-only access only where it is intentionally public.

revoke all privileges on table public.players from anon, authenticated;
revoke all privileges on table public.matches from anon, authenticated;
revoke all privileges on table public.results from anon, authenticated;

revoke all privileges on table public.public_players from anon, authenticated;
revoke all privileges on table public.public_matches from anon, authenticated;
revoke all privileges on table public.public_results from anon, authenticated;
revoke all privileges on table public.latest_public_results from anon, authenticated;

grant select on table public.public_players to anon, authenticated;
grant select on table public.public_matches to anon, authenticated;
grant select on table public.public_results to anon, authenticated;
grant select on table public.latest_public_results to anon, authenticated;

-- Verification:
-- select grantee, table_name, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public'
--   and grantee in ('anon', 'authenticated')
--   and table_name in (
--     'players',
--     'matches',
--     'results',
--     'public_players',
--     'public_matches',
--     'public_results',
--     'latest_public_results'
--   )
-- order by table_name, grantee, privilege_type;
--
-- Expected result:
-- - public.players, public.matches, public.results: no rows for anon/authenticated
-- - public.public_players, public.public_matches, public.public_results, public.latest_public_results: SELECT only
