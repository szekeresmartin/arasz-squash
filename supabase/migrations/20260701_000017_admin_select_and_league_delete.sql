-- Postgres needs SELECT privilege to evaluate the WHERE/RLS filter on an
-- UPDATE or DELETE, even when Prefer: return=minimal suppresses the response
-- body. Grant it to "authenticated" only -- "anon" keeps reading these two
-- tables exclusively through the public_players/public_matches views.
grant select on public.players to authenticated;
grant select on public.matches to authenticated;

-- Allow removing a league outright (e.g. a mistakenly created one), not just
-- deactivating it. players/matches/results cascade-delete from leagues, so
-- this is only ever used from the admin UI on leagues that have no players.
grant delete on public.leagues to authenticated;
