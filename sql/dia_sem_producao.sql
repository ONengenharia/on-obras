-- Fechamento do dia: registro de obras liberadas sem produção (chuva, emergencial etc.)
create table if not exists public.dia_sem_producao (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  data date not null,
  motivo text not null,
  obs text,
  autor uuid default auth.uid(),
  criado_em timestamptz not null default now(),
  unique (obra_id, data)
);
alter table public.dia_sem_producao enable row level security;
create policy dsp_ler on public.dia_sem_producao for select to authenticated using (privado.pode_ver(obra_id));
create policy dsp_inserir on public.dia_sem_producao for insert to authenticated with check (privado.pode_ver(obra_id));
create policy dsp_alterar on public.dia_sem_producao for update to authenticated using (privado.pode_ver(obra_id)) with check (privado.pode_ver(obra_id));
create policy dsp_apagar on public.dia_sem_producao for delete to authenticated using (privado.pode_ver(obra_id));
grant select, insert, update, delete on public.dia_sem_producao to authenticated;
