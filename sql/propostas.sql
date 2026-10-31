-- Proposta em revista (OrçaRede): tabelas, RLS e funções públicas (cliente sem login, só por código)
create table if not exists orcarede.propostas(
  id uuid primary key default gen_random_uuid(),
  orcamento_id uuid not null unique references orcarede.orcamentos(id) on delete cascade,
  codigo text not null unique default substr(md5(random()::text||clock_timestamp()::text||gen_random_uuid()::text),1,14),
  versao int not null default 1,
  status text not null default 'rascunho' check (status in ('rascunho','enviada','aceita')),
  dados jsonb not null default '{}'::jsonb,
  pdf_path text,
  enviada_em timestamptz,
  enviada_por uuid,
  aceite jsonb,
  criado_por uuid default auth.uid(),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create table if not exists orcarede.proposta_eventos(
  id bigserial primary key,
  proposta_id uuid not null references orcarede.propostas(id) on delete cascade,
  tipo text not null,
  info jsonb,
  criado_em timestamptz not null default now()
);
create index if not exists proposta_eventos_p on orcarede.proposta_eventos(proposta_id, criado_em desc);
create table if not exists orcarede.proposta_modelos(
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text,
  dados jsonb not null default '{}'::jsonb,
  criado_por uuid default auth.uid(),
  criado_em timestamptz not null default now()
);
alter table orcarede.propostas enable row level security;
alter table orcarede.proposta_eventos enable row level security;
alter table orcarede.proposta_modelos enable row level security;
create policy usuarios_painel on orcarede.propostas for all to authenticated using ((select orcarede.eh_usuario())) with check ((select orcarede.eh_usuario()));
create policy usuarios_painel on orcarede.proposta_eventos for all to authenticated using ((select orcarede.eh_usuario())) with check ((select orcarede.eh_usuario()));
create policy usuarios_painel on orcarede.proposta_modelos for all to authenticated using ((select orcarede.eh_usuario())) with check ((select orcarede.eh_usuario()));
grant select,insert,update,delete on orcarede.propostas, orcarede.proposta_eventos, orcarede.proposta_modelos to authenticated;
grant usage,select on sequence orcarede.proposta_eventos_id_seq to authenticated;

create or replace function public.proposta_publica(p_codigo text, p_ua text default null)
returns jsonb language plpgsql security definer set search_path=public,orcarede as $$
declare r orcarede.propostas; neg uuid; ult timestamptz; cli text;
begin
  select * into r from orcarede.propostas where codigo=p_codigo and status in ('enviada','aceita');
  if not found then return null; end if;
  select max(criado_em) into ult from orcarede.proposta_eventos where proposta_id=r.id and tipo='abriu';
  insert into orcarede.proposta_eventos(proposta_id,tipo,info) values(r.id,'abriu',jsonb_build_object('ua',left(coalesce(p_ua,''),200)));
  if ult is null or ult < now()-interval '2 minutes' then
    select o.negocio_id, o.cliente into neg, cli from orcarede.orcamentos o where o.id=r.orcamento_id;
    perform privado.avisar(array[r.enviada_por,r.criado_por], 'proposta', 'Proposta aberta pelo cliente'||coalesce(' · '||cli,''), neg);
  end if;
  return jsonb_build_object('dados',r.dados,'status',r.status,'pdf_path',r.pdf_path,'aceite',r.aceite,'enviada_em',r.enviada_em,'versao',r.versao);
end $$;

create or replace function public.proposta_evento(p_codigo text, p_tipo text, p_info jsonb default null)
returns void language plpgsql security definer set search_path=public,orcarede as $$
declare r orcarede.propostas; neg uuid; cli text;
begin
  if p_tipo not in ('pdf','whats','pagina') then return; end if;
  select * into r from orcarede.propostas where codigo=p_codigo and status in ('enviada','aceita');
  if not found then return; end if;
  insert into orcarede.proposta_eventos(proposta_id,tipo,info) values(r.id,p_tipo,p_info);
  if p_tipo in ('pdf','whats') then
    select o.negocio_id, o.cliente into neg, cli from orcarede.orcamentos o where o.id=r.orcamento_id;
    perform privado.avisar(array[r.enviada_por,r.criado_por],'proposta',case p_tipo when 'pdf' then 'Cliente baixou o PDF da proposta' else 'Cliente clicou para falar com o representante' end||coalesce(' · '||cli,''),neg);
  end if;
end $$;

create or replace function public.proposta_aceitar(p_codigo text, p_nome text, p_doc text default null)
returns jsonb language plpgsql security definer set search_path=public,orcarede as $$
declare r orcarede.propostas; neg uuid; cli text; ac jsonb;
begin
  if coalesce(trim(p_nome),'')='' then raise exception 'Informe o nome'; end if;
  select * into r from orcarede.propostas where codigo=p_codigo and status in ('enviada','aceita');
  if not found then raise exception 'Proposta indisponível'; end if;
  if r.status='aceita' then return r.aceite; end if;
  ac:=jsonb_build_object('nome',left(trim(p_nome),120),'doc',left(coalesce(p_doc,''),40),'em',now());
  update orcarede.propostas set status='aceita',aceite=ac,atualizado_em=now() where id=r.id;
  insert into orcarede.proposta_eventos(proposta_id,tipo,info) values(r.id,'aceite',ac);
  select o.negocio_id, o.cliente into neg, cli from orcarede.orcamentos o where o.id=r.orcamento_id;
  perform privado.avisar(array[r.enviada_por,r.criado_por],'proposta','PROPOSTA ACEITA por '||left(trim(p_nome),80)||coalesce(' · '||cli,''),neg);
  return ac;
end $$;
revoke all on function public.proposta_publica(text,text), public.proposta_evento(text,text,jsonb), public.proposta_aceitar(text,text,text) from public;
grant execute on function public.proposta_publica(text,text), public.proposta_evento(text,text,jsonb), public.proposta_aceitar(text,text,text) to anon, authenticated;
