-- Gerenciador de obras = espelho dos negócios (elétrica) nas colunas da área "Obras" (A Iniciar, Execução, Concluído)
-- 1) colunas do Gerenciador com o mesmo nome/cor das colunas de Negócios
update public.colunas set nome='A Iniciar', cor='#143bad' where id='liberado';
update public.colunas set nome='Execução',  cor='#2f6f9f' where id='andamento';
update public.colunas set nome='Concluído', cor='#1f8a4c' where id='finalizado';

create or replace function privado.nt(t text) returns text language sql immutable as
$$ select lower(btrim(regexp_replace(coalesce(t,''),'\s+',' ','g'))) $$;

-- 2) garante a obra de um negócio e a deixa na coluna espelhada.
--    Se já existir obra feita à mão com o mesmo cliente/título (sem negócio), ela é MANTIDA e apenas vinculada.
create or replace function public.espelho_obra(nid uuid) returns uuid
language plpgsql security definer set search_path to 'public','privado' as $$
declare n public.negocios; cn text; cid text; ob uuid;
begin
  select * into n from public.negocios where id=nid;
  if n.id is null or n.quadro<>'eletrica' then return null; end if;
  select c.nome into cn from public.neg_colunas c join public.neg_areas a on a.id=c.area
   where c.id=n.coluna and a.nome in ('Compras','Obras');
  cid := case cn when 'Compras' then 'compras' when 'A Iniciar' then 'liberado' when 'Execução' then 'andamento' when 'Concluído' then 'finalizado' end;
  if cid is null then return null; end if;
  perform set_config('on.rpc','1',true);
  ob := n.obra_id;
  if ob is null then
    select o.id into ob from public.obras o
     where coalesce(o.dados->'obra'->>'negocio','')='' and coalesce(o.tipo,'')<>'demo'
       and not exists (select 1 from public.negocios x where x.obra_id=o.id)
       and (privado.nt(o.titulo)=privado.nt(n.titulo) or (privado.nt(o.cliente)<>'' and privado.nt(o.cliente)=privado.nt(n.cliente)))
     order by o.ordem limit 1;
    if ob is not null then
      update public.obras set dados = coalesce(dados,'{}'::jsonb) || jsonb_build_object('obra', coalesce(dados->'obra','{}'::jsonb) || jsonb_build_object('negocio', n.id)) where id=ob;
    else
      insert into public.obras(titulo,cliente,local,coluna,ordem,tipo,lat,lng,dados)
      values (n.titulo,n.cliente,n.cidade,cid,extract(epoch from now()),n.tipo,n.lat,n.lng,
              jsonb_build_object('obra', jsonb_build_object('negocio',n.id,'mapsLink',coalesce(n.maps,''),'concessionaria',coalesce(n.conc,''))))
      returning id into ob;
    end if;
    update public.negocios set obra_id=ob where id=n.id;
    insert into public.neg_historico(negocio_id,texto,autor_nome) values (n.id,'Obra espelhada no Gerenciador de obras',coalesce(privado.meu_nome(),'Sistema'));
  end if;
  update public.obras set coluna=cid where id=ob and coluna is distinct from cid;
  return ob;
end $$;

create or replace function public.neg_espelho_trg() returns trigger language plpgsql security definer set search_path to 'public','privado' as $$
begin perform public.espelho_obra(new.id); return new; end $$;
drop trigger if exists negocios_espelho_obra on public.negocios;
create trigger negocios_espelho_obra after insert or update of coluna on public.negocios
  for each row when (new.quadro='eletrica') execute function public.neg_espelho_trg();

-- 3) preenche o que já existe
select public.espelho_obra(n.id) from public.negocios n
 join public.neg_colunas c on c.id=n.coluna join public.neg_areas a on a.id=c.area
 where n.quadro='eletrica' and a.nome in ('Compras','Obras');
