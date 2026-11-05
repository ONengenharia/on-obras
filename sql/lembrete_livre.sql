-- Lembretes livres (sem negócio vinculado)
alter table public.neg_lembretes alter column negocio_id drop not null;
drop policy if exists criar on public.neg_lembretes;
create policy criar on public.neg_lembretes for insert to authenticated
  with check ((negocio_id is null and privado.ativo()) or privado.ve_negocio(negocio_id));
