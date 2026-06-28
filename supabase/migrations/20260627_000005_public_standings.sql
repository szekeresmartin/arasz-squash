-- Public, read-only standings view computed from approved results.
-- This keeps the ranking logic server-side so every client sees the same table.

create or replace view public.public_standings as
with active_players as (
  select
    p.league_id,
    p.id as player_id,
    p.name as player_name
  from public.players p
  where p.active = true
),
ordered_results as (
  select
    r.id as result_id,
    r.league_id,
    r.match_id,
    r.player1_id,
    r.player2_id,
    r.normalized_sets_won,
    r.normalized_sets_lost,
    r.kind,
    m.round_number,
    row_number() over (
      partition by r.league_id
      order by coalesce(m.round_number, 0), m.id, r.id
    ) as event_order
  from public.results r
  join public.matches m
    on m.id = r.match_id
  join public.players p1
    on p1.id = r.player1_id
   and p1.active = true
  join public.players p2
    on p2.id = r.player2_id
   and p2.active = true
  where r.status = 'approved'
),
player_events as (
  select
    ap.league_id,
    ap.player_id,
    ap.player_name,
    orr.event_order,
    case
      when orr.player1_id = ap.player_id then orr.normalized_sets_won > orr.normalized_sets_lost
      else orr.normalized_sets_lost > orr.normalized_sets_won
    end as did_win,
    case
      when orr.kind = 'walkover' then
        case
          when orr.player1_id = ap.player_id then
            case when orr.normalized_sets_won > orr.normalized_sets_lost then 5 else 0 end
          else
            case when orr.normalized_sets_lost > orr.normalized_sets_won then 5 else 0 end
        end
      else
        case
          when orr.player1_id = ap.player_id then
            case when orr.normalized_sets_won > orr.normalized_sets_lost then 5 else orr.normalized_sets_won + 1 end
          else
            case when orr.normalized_sets_lost > orr.normalized_sets_won then 5 else orr.normalized_sets_lost + 1 end
        end
    end as points_for_player,
    case
      when orr.kind <> 'walkover' then
        case when orr.player1_id = ap.player_id then orr.normalized_sets_won else orr.normalized_sets_lost end
      else 0
    end as sets_won_for_player,
    case
      when orr.kind <> 'walkover' then
        case when orr.player1_id = ap.player_id then orr.normalized_sets_lost else orr.normalized_sets_won end
      else 0
    end as sets_lost_for_player,
    case
      when orr.player1_id = ap.player_id and orr.normalized_sets_won > orr.normalized_sets_lost then 'W'
      when orr.player2_id = ap.player_id and orr.normalized_sets_lost > orr.normalized_sets_won then 'W'
      else 'L'
    end as form_result
  from active_players ap
  join ordered_results orr
    on orr.league_id = ap.league_id
   and (orr.player1_id = ap.player_id or orr.player2_id = ap.player_id)
),
player_stats as (
  select
    ap.league_id,
    ap.player_id,
    ap.player_name,
    count(pe.event_order) as matches_played,
    coalesce(sum(case when pe.did_win then 1 else 0 end), 0) as wins,
    coalesce(sum(case when pe.event_order is not null and not pe.did_win then 1 else 0 end), 0) as losses,
    coalesce(sum(pe.sets_won_for_player), 0) as sets_won,
    coalesce(sum(pe.sets_lost_for_player), 0) as sets_lost,
    coalesce(sum(pe.points_for_player), 0) as points,
    coalesce(array_agg(pe.form_result order by pe.event_order) filter (where pe.event_order is not null), '{}'::text[]) as form_all
  from active_players ap
  left join player_events pe
    on pe.league_id = ap.league_id
   and pe.player_id = ap.player_id
  group by ap.league_id, ap.player_id, ap.player_name
),
pair_results as (
  select
    r.league_id,
    least(r.player1_id, r.player2_id) as player_a_id,
    greatest(r.player1_id, r.player2_id) as player_b_id,
    count(*) as direct_count,
    max(
      case
        when r.player1_id = least(r.player1_id, r.player2_id) then r.normalized_sets_won
        else r.normalized_sets_lost
      end
    ) as a_sets,
    max(
      case
        when r.player1_id = least(r.player1_id, r.player2_id) then r.normalized_sets_lost
        else r.normalized_sets_won
      end
    ) as b_sets
  from ordered_results r
  group by
    r.league_id,
    least(r.player1_id, r.player2_id),
    greatest(r.player1_id, r.player2_id)
),
pair_winners as (
  select
    league_id,
    player_a_id,
    player_b_id,
    case
      when direct_count = 1 and a_sets <> b_sets then case when a_sets > b_sets then player_a_id else player_b_id end
      else null
    end as winner_id
  from pair_results
),
tie_priority as (
  select
    ps1.league_id,
    ps1.player_id,
    coalesce(count(*) filter (where pw.winner_id = ps1.player_id), 0) as head_to_head_wins
  from player_stats ps1
  left join player_stats ps2
    on ps2.league_id = ps1.league_id
   and ps2.player_id <> ps1.player_id
   and ps2.points = ps1.points
   and ps2.wins = ps1.wins
   and ps2.sets_won - ps2.sets_lost = ps1.sets_won - ps1.sets_lost
   and ps2.sets_won = ps1.sets_won
  left join pair_winners pw
    on pw.league_id = ps1.league_id
   and (
     (pw.player_a_id = ps1.player_id and pw.player_b_id = ps2.player_id)
     or (pw.player_a_id = ps2.player_id and pw.player_b_id = ps1.player_id)
   )
  group by ps1.league_id, ps1.player_id
),
ranked as (
  select
    ps.league_id,
    ps.player_id,
    ps.player_name,
    ps.matches_played,
    ps.wins,
    ps.losses,
    ps.sets_won,
    ps.sets_lost,
    ps.sets_won - ps.sets_lost as set_difference,
    ps.points,
    ps.points * 1000000 + ps.wins * 10000 + (ps.sets_won - ps.sets_lost) * 100 + ps.sets_won as ranking_score,
    case
      when coalesce(cardinality(ps.form_all), 0) > 4 then ps.form_all[(cardinality(ps.form_all) - 3):cardinality(ps.form_all)]
      else ps.form_all
    end as form,
    coalesce(tp.head_to_head_wins, 0) as head_to_head_wins
  from player_stats ps
  left join tie_priority tp
    on tp.league_id = ps.league_id
   and tp.player_id = ps.player_id
)
select
  league_id,
  player_id,
  player_name,
  row_number() over (
    partition by league_id
    order by points desc, wins desc, set_difference desc, sets_won desc, head_to_head_wins desc, player_name asc
  ) as position,
  matches_played,
  wins,
  losses,
  sets_won,
  sets_lost,
  set_difference,
  points,
  ranking_score,
  coalesce(form, '{}'::text[]) as form
from ranked
order by league_id, position, player_name;

revoke all privileges on table public.public_standings from anon, authenticated;
grant select on table public.public_standings to anon, authenticated;

-- Verification:
-- select grantee, table_name, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public'
--   and grantee in ('anon', 'authenticated')
--   and table_name = 'public_standings'
-- order by privilege_type;
--
-- select *
-- from public.public_standings
-- where league_id = 'league-a'
-- order by position;
