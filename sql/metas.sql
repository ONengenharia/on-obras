-- Metas (previsto) por mês e quadro + data de fechamento dos negócios (realizado automático)
create table if not exists public.metas (
  mes date not null,                    -- sempre dia 1 do mês
  quadro text not null,                 -- 'geral' | 'eletrica' | 'solar'
  valor numeric not null default 0,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid default auth.uid(),
  primary key (mes, quadro)
);
alter table public.metas enable row level security;
create policy metas_adm on public.metas for all to authenticated using (privado.is_admin()) with check (privado.is_admin());
grant select, insert, update, delete on public.metas to authenticated;

alter table public.negocios add column if not exists fechado_em timestamptz;

create or replace function privado.col_fechamento(p_nome text) returns boolean
language sql immutable as $$
  select lower(coalesce(p_nome,'')) ~ '^(negociado|contrato|compras|a iniciar|execu|conclu|elabora[cç][aã]o de contrato|levantamento|compras material|obras )'
$$;

create or replace function privado.negocio_fechado_trg() returns trigger
language plpgsql security definer set search_path = public, privado as $$
declare v_nome text;
begin
  if new.coluna is distinct from old.coluna then
    select nome into v_nome from public.neg_colunas where id = new.coluna;
    if privado.col_fechamento(v_nome) then
      if new.fechado_em is null then new.fechado_em := now(); end if;
    else
      new.fechado_em := null;  -- voltou para antes do fechamento ou foi perdido
    end if;
  end if;
  return new;
end $$;
drop trigger if exists negocio_fechado on public.negocios;
create trigger negocio_fechado before update of coluna on public.negocios
for each row execute function privado.negocio_fechado_trg();

-- Preenche o histórico: negócios que já estão em etapa de fechamento (data aproximada = última atualização)
update public.negocios n set fechado_em = coalesce(n.atualizado_em, now())
from public.neg_colunas c
where c.id = n.coluna and privado.col_fechamento(c.nome) and n.fechado_em is null;
