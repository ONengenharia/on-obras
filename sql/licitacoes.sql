-- Licitações (OrçaRede): editais captados do PNCP, condições de busca e funil.
-- Aplicar no Supabase (SQL Editor) só depois de revisar. Não altera nenhuma tabela existente.

create table if not exists orcarede.licitacao_editais(
  id uuid primary key default gen_random_uuid(),
  pncp_id text not null unique,                 -- numeroControlePNCP (ou CNPJ-ano-sequencial)
  cnpj_orgao text,
  ano int,
  sequencial int,
  orgao text,
  municipio text,
  uf text,
  objeto text not null,
  modalidade text,
  modalidade_id int,
  valor_estimado numeric,
  abertura_propostas timestamptz,
  encerramento_propostas timestamptz,
  situacao_pncp text,
  link_pncp text,                               -- página do edital no PNCP
  link_origem text,                             -- portal onde a disputa acontece (quando o PNCP informa)
  palavras text[] not null default '{}',        -- palavras-chave que casaram
  unidade text,                                 -- 'eletrica' | 'solar'
  status text not null default 'novo' check (status in ('novo','em_triagem','aprovado','descartado','proposta','ganhou','perdeu')),
  nota text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  alterado_em timestamptz,
  alterado_por uuid
);
create index if not exists licitacao_editais_enc on orcarede.licitacao_editais(encerramento_propostas);
create index if not exists licitacao_editais_status on orcarede.licitacao_editais(status);

-- Condições da empresa (uma linha só). O coletor lê daqui; a tela Licitações edita aqui.
create table if not exists orcarede.licitacao_condicoes(
  id int primary key default 1 check (id = 1),
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid
);
insert into orcarede.licitacao_condicoes(id, dados) values (1, jsonb_build_object(
  'uf', 'RS',
  'dias_busca', 60,
  'modalidades', jsonb_build_array(4, 5, 6),
  'palavras', jsonb_build_array('fotovoltaic','usina solar','energia solar','geração distribuída','instalações elétricas','instalação elétrica','subestação','iluminação pública','iluminação','LED','rede de distribuição','rede elétrica','manutenção elétrica','engenharia elétrica','serviços elétricos','cabeamento','SPDA'),
  'excluir', jsonb_build_array(),
  'valor_min', null,
  'valor_max', null,
  'dias_minimos', 7
)) on conflict (id) do nothing;

-- Registra quem mexeu no status ou na nota (o coletor, que não tem usuário, não conta).
create or replace function orcarede.licitacao_editais_alterado() returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status or new.nota is distinct from old.nota then
    new.alterado_em := now();
    new.alterado_por := auth.uid();
  end if;
  return new;
end $$;
drop trigger if exists licitacao_editais_alterado on orcarede.licitacao_editais;
create trigger licitacao_editais_alterado before update on orcarede.licitacao_editais
for each row execute function orcarede.licitacao_editais_alterado();

alter table orcarede.licitacao_editais enable row level security;
alter table orcarede.licitacao_condicoes enable row level security;

-- Mesmos níveis do restante do OrçaRede: quem vê, lê; quem edita, muda status, nota e condições.
create policy acesso_ler on orcarede.licitacao_editais for select to authenticated using ((select orcarede.orc_pode_ver()));
create policy acesso_editar on orcarede.licitacao_editais for update to authenticated using ((select orcarede.orc_pode_editar())) with check ((select orcarede.orc_pode_editar()));
create policy acesso_ler on orcarede.licitacao_condicoes for select to authenticated using ((select orcarede.orc_pode_ver()));
create policy acesso_editar on orcarede.licitacao_condicoes for update to authenticated using ((select orcarede.orc_pode_editar())) with check ((select orcarede.orc_pode_editar()));

-- Usuários só podem mudar status e nota dos editais (o resto vem do coletor) e os dados das condições.
revoke all on orcarede.licitacao_editais, orcarede.licitacao_condicoes from authenticated;
grant select on orcarede.licitacao_editais, orcarede.licitacao_condicoes to authenticated;
grant update (status, nota) on orcarede.licitacao_editais to authenticated;
grant update (dados, atualizado_em, atualizado_por) on orcarede.licitacao_condicoes to authenticated;

-- O coletor (GitHub Actions) usa a chave de serviço.
grant usage on schema orcarede to service_role;
grant select, insert, update, delete on orcarede.licitacao_editais, orcarede.licitacao_condicoes to service_role;
