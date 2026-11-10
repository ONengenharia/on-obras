create table if not exists public.relatorios_salvos(
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  config jsonb not null default '{}'::jsonb,
  criado_por uuid default auth.uid(),
  criado_em timestamptz default now());
alter table public.relatorios_salvos enable row level security;
create policy rel_salvos_admin on public.relatorios_salvos for all to authenticated
  using (privado.is_admin()) with check (privado.is_admin());
