revoke all on table public.public_players from anon, authenticated;
revoke all on table public.public_matches from anon, authenticated;
revoke all on table public.public_results from anon, authenticated;
revoke all on table public.latest_public_results from anon, authenticated;

grant select on table public.public_players to anon, authenticated;
grant select on table public.public_matches to anon, authenticated;
grant select on table public.public_results to anon, authenticated;
grant select on table public.latest_public_results to anon, authenticated;
