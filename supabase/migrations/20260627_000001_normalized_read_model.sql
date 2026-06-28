create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.seasons (
  id text primary key,
  slug text not null unique,
  name text not null,
  starts_at date,
  ends_at date,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leagues (
  id text primary key,
  season_id text not null references public.seasons(id) on delete cascade,
  slug text not null,
  name text not null,
  sheet_name text not null,
  class_label text not null,
  display_order integer not null,
  player_count integer not null default 0,
  rules text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, slug),
  unique (season_id, display_order)
);

create table if not exists public.players (
  id text primary key,
  league_id text not null references public.leagues(id) on delete cascade,
  name text not null,
  source_sheet_name text not null,
  header_cell text,
  row_cell text,
  order_index integer not null,
  active boolean not null default true,
  phone text,
  email text,
  join_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (league_id, order_index)
);

create table if not exists public.matches (
  id text primary key,
  league_id text not null references public.leagues(id) on delete cascade,
  player1_id text not null references public.players(id) on delete cascade,
  player2_id text not null references public.players(id) on delete cascade,
  round_number integer not null,
  source_cell text,
  reverse_source_cell text,
  status text not null,
  submission_type text,
  submitted_score_home integer,
  submitted_score_away integer,
  submitted_at timestamptz,
  submitted_by uuid references auth.users(id) on delete set null,
  submitter_name text,
  submitter_contact text,
  comment text,
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_status_check
    check (status in ('planned', 'submitted', 'approved', 'rejected')),
  constraint matches_submission_type_check
    check (submission_type is null or submission_type in ('planned', 'custom'))
);

create unique index if not exists matches_unique_pair_idx
  on public.matches (
    league_id,
    least(player1_id, player2_id),
    greatest(player1_id, player2_id)
  );

create index if not exists matches_league_round_idx
  on public.matches (league_id, round_number);

create index if not exists matches_league_status_idx
  on public.matches (league_id, status);

create index if not exists matches_submitted_at_idx
  on public.matches (submitted_at desc nulls last);

create table if not exists public.results (
  id text primary key,
  league_id text not null references public.leagues(id) on delete cascade,
  match_id text not null unique references public.matches(id) on delete cascade,
  player1_id text not null references public.players(id) on delete cascade,
  player2_id text not null references public.players(id) on delete cascade,
  source_sheet text not null,
  source_cells text[] not null default '{}'::text[],
  raw_home_token text not null,
  raw_away_token text,
  normalized_sets_won integer not null,
  normalized_sets_lost integer not null,
  kind text not null,
  status text not null,
  played_on_court boolean not null default false,
  is_forfeit boolean not null default false,
  imported_at timestamptz,
  submitted_at timestamptz,
  submitted_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  source text,
  source_reference text,
  normalized_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint results_kind_check
    check (kind in ('score', 'walkover')),
  constraint results_status_check
    check (status in ('approved'))
);

create index if not exists results_league_idx
  on public.results (league_id);

create index if not exists results_imported_at_idx
  on public.results (imported_at desc nulls last);

create index if not exists results_approved_at_idx
  on public.results (approved_at desc nulls last);

create index if not exists results_latest_feed_idx
  on public.results (league_id, approved_at desc nulls last, imported_at desc nulls last, created_at desc nulls last);

create table if not exists public.sponsors (
  id text primary key,
  name text not null,
  logo_text text not null,
  logo_path text,
  website_url text,
  color_hex text not null,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sponsors_active_order_idx
  on public.sponsors (is_active, display_order);

drop trigger if exists set_seasons_updated_at on public.seasons;
create trigger set_seasons_updated_at
before update on public.seasons
for each row
execute function public.touch_updated_at();

drop trigger if exists set_leagues_updated_at on public.leagues;
create trigger set_leagues_updated_at
before update on public.leagues
for each row
execute function public.touch_updated_at();

drop trigger if exists set_players_updated_at on public.players;
create trigger set_players_updated_at
before update on public.players
for each row
execute function public.touch_updated_at();

drop trigger if exists set_matches_updated_at on public.matches;
create trigger set_matches_updated_at
before update on public.matches
for each row
execute function public.touch_updated_at();

drop trigger if exists set_results_updated_at on public.results;
create trigger set_results_updated_at
before update on public.results
for each row
execute function public.touch_updated_at();

drop trigger if exists set_sponsors_updated_at on public.sponsors;
create trigger set_sponsors_updated_at
before update on public.sponsors
for each row
execute function public.touch_updated_at();

alter table public.seasons enable row level security;
alter table public.leagues enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.results enable row level security;
alter table public.sponsors enable row level security;

drop policy if exists "Public read seasons" on public.seasons;
create policy "Public read seasons"
on public.seasons
for select
using (true);

drop policy if exists "Public read leagues" on public.leagues;
create policy "Public read leagues"
on public.leagues
for select
using (true);

drop policy if exists "Public read players" on public.players;
create or replace view public.public_players as
select
  id,
  league_id,
  name,
  source_sheet_name,
  header_cell,
  row_cell,
  order_index,
  active,
  created_at,
  updated_at
from public.players;

drop policy if exists "Public read players" on public.players;

drop policy if exists "Public read matches" on public.matches;
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
  updated_at
from public.matches;

drop policy if exists "Public read matches" on public.matches;

drop policy if exists "Public read results" on public.results;
create or replace view public.public_results as
select
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
  normalized_token,
  created_at,
  updated_at
from public.results;

drop policy if exists "Public read results" on public.results;

create or replace view public.latest_public_results as
select
  r.id,
  r.league_id,
  r.match_id,
  r.player1_id,
  r.player2_id,
  r.source_sheet,
  r.source_cells,
  r.raw_home_token,
  r.raw_away_token,
  r.normalized_sets_won,
  r.normalized_sets_lost,
  r.kind,
  r.status,
  r.played_on_court,
  r.is_forfeit,
  r.imported_at,
  r.submitted_at,
  r.approved_at,
  r.source,
  r.source_reference,
  r.normalized_token,
  r.created_at,
  r.updated_at
from public.results r
order by coalesce(r.approved_at, r.imported_at, r.created_at) desc, r.id desc
limit 3;

drop policy if exists "Public read sponsors" on public.sponsors;
create policy "Public read sponsors"
on public.sponsors
for select
using (true);

grant select on table public.seasons to anon, authenticated;
grant select on table public.leagues to anon, authenticated;
grant select on table public.sponsors to anon, authenticated;
grant select on table public.public_players to anon, authenticated;
grant select on table public.public_matches to anon, authenticated;
grant select on table public.public_results to anon, authenticated;
grant select on table public.latest_public_results to anon, authenticated;
