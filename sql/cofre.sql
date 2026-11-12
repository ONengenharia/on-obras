-- Cofre de documentos da empresa (OrçaRede): CATs com quantitativos, certidões e habilitação, com validade.
-- Aplicar no Supabase só depois de revisar. Não altera nenhuma tabela existente.

create table if not exists orcarede.cofre_documentos(
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('cat','certidao','habilitacao','societario','financeiro','outro')),
  titulo text not null,
  numero text,                                  -- nº da CAT, da certidão, etc.
  emissor text,                                 -- CREA, Receita, Prefeitura...
  responsavel text,                             -- responsável técnico (CAT)
  contratante text,                             -- para quem a obra/serviço foi feito (CAT)
  objeto text,                                  -- descrição do serviço atestado (CAT)
  unidades text[] not null default '{}',        -- 'eletrica' | 'solar' | 'servicos'
  emissao date,
  validade date,                                -- vazio = não vence (CAT, contrato social)
  arquivo_path text,                            -- caminho no bucket privado "cofre"
  arquivo_nome text,
  nota text,
  criado_em timestamptz not null default now(),
  criado_por uuid default auth.uid(),
  atualizado_em timestamptz not null default now()
);
create index if not exists cofre_documentos_tipo on orcarede.cofre_documentos(tipo);
create index if not exists cofre_documentos_validade on orcarede.cofre_documentos(validade);

-- Quantitativos de cada CAT (o que o edital costuma exigir: "atestado de 500 m de rede", "usina de 100 kWp"...).
create table if not exists orcarede.cofre_cat_itens(
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references orcarede.cofre_documentos(id) on delete cascade,
  descricao text not null,
  unidade_medida text,                          -- m, un, kWp, kVA...
  quantidade numeric,
  categoria text,                               -- livre: rede_distribuicao, subestacao, usina_solar, spda...
  criado_em timestamptz not null default now()
);
create index if not exists cofre_cat_itens_doc on orcarede.cofre_cat_itens(documento_id);

create or replace function orcarede.cofre_documentos_atualizado() returns trigger language plpgsql set search_path = '' as $$
begin
  new.atualizado_em := now();
  return new;
end $$;
drop trigger if exists cofre_documentos_atualizado on orcarede.cofre_documentos;
create trigger cofre_documentos_atualizado before update on orcarede.cofre_documentos
for each row execute function orcarede.cofre_documentos_atualizado();

alter table orcarede.cofre_documentos enable row level security;
alter table orcarede.cofre_cat_itens enable row level security;

-- Mesmos níveis do OrçaRede: quem vê, lê; quem edita, cadastra, altera e apaga.
create policy acesso_ler on orcarede.cofre_documentos for select to authenticated using ((select orcarede.orc_pode_ver()));
create policy acesso_inserir on orcarede.cofre_documentos for insert to authenticated with check ((select orcarede.orc_pode_editar()));
create policy acesso_editar on orcarede.cofre_documentos for update to authenticated using ((select orcarede.orc_pode_editar())) with check ((select orcarede.orc_pode_editar()));
create policy acesso_apagar on orcarede.cofre_documentos for delete to authenticated using ((select orcarede.orc_pode_editar()));
create policy acesso_ler on orcarede.cofre_cat_itens for select to authenticated using ((select orcarede.orc_pode_ver()));
create policy acesso_inserir on orcarede.cofre_cat_itens for insert to authenticated with check ((select orcarede.orc_pode_editar()));
create policy acesso_editar on orcarede.cofre_cat_itens for update to authenticated using ((select orcarede.orc_pode_editar())) with check ((select orcarede.orc_pode_editar()));
create policy acesso_apagar on orcarede.cofre_cat_itens for delete to authenticated using ((select orcarede.orc_pode_editar()));

revoke all on orcarede.cofre_documentos, orcarede.cofre_cat_itens from authenticated;
grant select, insert, update, delete on orcarede.cofre_documentos, orcarede.cofre_cat_itens to authenticated;
grant usage on schema orcarede to service_role;
grant select, insert, update, delete on orcarede.cofre_documentos, orcarede.cofre_cat_itens to service_role;

-- Bucket privado só para o cofre (documentos da empresa não ficam no bucket das obras).
insert into storage.buckets(id, name, public, file_size_limit)
values ('cofre', 'cofre', false, 52428800)
on conflict (id) do nothing;

create policy cofre_ler on storage.objects for select to authenticated
  using (bucket_id = 'cofre' and (select orcarede.orc_pode_ver()));
create policy cofre_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'cofre' and (select orcarede.orc_pode_editar()));
create policy cofre_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'cofre' and (select orcarede.orc_pode_editar()));
