create table if not exists public.app_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_app_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_app_state_updated_at on public.app_state;
create trigger set_app_state_updated_at
before update on public.app_state
for each row
execute function public.touch_app_state_updated_at();

alter table public.app_state enable row level security;

drop policy if exists "Public read app state" on public.app_state;
create policy "Public read app state"
on public.app_state
for select
using (true);

drop policy if exists "Public insert app state" on public.app_state;
create policy "Public insert app state"
on public.app_state
for insert
with check (true);

drop policy if exists "Public update app state" on public.app_state;
create policy "Public update app state"
on public.app_state
for update
using (true)
with check (true);
