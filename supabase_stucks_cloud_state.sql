begin;

create table if not exists public.stucks_cloud_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  row_count integer not null default 0,
  cep_count integer not null default 0,
  current_file text,
  imported_at timestamptz,
  updated_by uuid references auth.users(id) on delete set null,
  updated_by_email text,
  updated_at timestamptz not null default now()
);

alter table public.stucks_cloud_state enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.stucks_cloud_state to anon, authenticated;

create index if not exists stucks_cloud_state_updated_at_idx
  on public.stucks_cloud_state (updated_at desc);

drop policy if exists "Allowed clients can read STUCKS cloud state"
  on public.stucks_cloud_state;
drop policy if exists "Allowed clients can insert STUCKS cloud state"
  on public.stucks_cloud_state;
drop policy if exists "Allowed clients can update STUCKS cloud state"
  on public.stucks_cloud_state;

drop policy if exists "Allowed users can read STUCKS cloud state"
  on public.stucks_cloud_state;
drop policy if exists "Allowed users can insert STUCKS cloud state"
  on public.stucks_cloud_state;
drop policy if exists "Allowed users can update STUCKS cloud state"
  on public.stucks_cloud_state;

create policy "Allowed clients can read STUCKS cloud state"
on public.stucks_cloud_state
for select
to anon, authenticated
using (true);

create policy "Allowed clients can insert STUCKS cloud state"
on public.stucks_cloud_state
for insert
to anon, authenticated
with check (true);

create policy "Allowed clients can update STUCKS cloud state"
on public.stucks_cloud_state
for update
to anon, authenticated
using (true)
with check (true);

comment on table public.stucks_cloud_state is
  'Snapshot mais recente da base STUCKS importada no dashboard. Usado para carregar a mesma base em outros computadores.';

notify pgrst, 'reload schema';

commit;
