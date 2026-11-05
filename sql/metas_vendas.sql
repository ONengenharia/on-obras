-- Lançamentos de vendas por unidade (solar, eletrica, servicos). origem = 'manual' ou 'gestaoclick' (ref_externa = id da venda, evita duplicar)
create table if not exists public.metas_vendas (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  unidade text not null check (unidade in ('solar','eletrica','servicos')),
  cliente text,
  descricao text,
  valor numeric not null,
  origem text not null default 'manual',
  ref_externa text,
  criado_por uuid default auth.uid(),
  criado_em timestamptz not null default now()
);
create unique index if not exists metas_vendas_ref on public.metas_vendas (origem, ref_externa) where ref_externa is not null;
alter table public.metas_vendas enable row level security;
create policy metas_vendas_adm on public.metas_vendas for all to authenticated using (privado.is_admin()) with check (privado.is_admin());
grant select, insert, update, delete on public.metas_vendas to authenticated;
