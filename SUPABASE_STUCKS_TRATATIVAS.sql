-- SUPABASE - ESTOQUE CENTRAL DE TRATATIVAS STUCKS
-- Execute no Supabase em SQL Editor > New query > Run.

create table if not exists public.stucks_tratativas (
  shipment_id text primary key,
  tratativa text not null default '',
  tracking_status text,
  cidade text,
  bairro text,
  driver text,
  ageing_last_status text,
  avaria text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_stucks_tratativas_updated_at on public.stucks_tratativas;
create trigger trg_stucks_tratativas_updated_at
before update on public.stucks_tratativas
for each row execute function public.set_updated_at();

alter table public.stucks_tratativas enable row level security;

-- Políticas abertas para uso do dashboard com anon/public key.
-- Use somente em um projeto Supabase dedicado a esse dashboard.
drop policy if exists "stucks_tratativas_select" on public.stucks_tratativas;
drop policy if exists "stucks_tratativas_insert" on public.stucks_tratativas;
drop policy if exists "stucks_tratativas_update" on public.stucks_tratativas;
drop policy if exists "stucks_tratativas_delete" on public.stucks_tratativas;

create policy "stucks_tratativas_select"
on public.stucks_tratativas for select
to anon, authenticated
using (true);

create policy "stucks_tratativas_insert"
on public.stucks_tratativas for insert
to anon, authenticated
with check (true);

create policy "stucks_tratativas_update"
on public.stucks_tratativas for update
to anon, authenticated
using (true)
with check (true);

create policy "stucks_tratativas_delete"
on public.stucks_tratativas for delete
to anon, authenticated
using (true);

create index if not exists idx_stucks_tratativas_updated_at
on public.stucks_tratativas(updated_at desc);
