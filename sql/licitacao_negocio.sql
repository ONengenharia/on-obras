-- Licitação como unidade de negócio: quadro próprio em Negócios e vínculo edital → negócio.
-- Aplicar no Supabase só depois de revisar. Só acrescenta dados e uma coluna nova; não altera Elétrica nem Solar.

insert into public.neg_quadros(id, nome, cor, ordem)
values ('licitacao', 'Licitação', '#8a5a2b', 3)
on conflict (id) do nothing;

-- Etapas do processo de licitação, cada uma na área responsável (quem vê a coluna segue o acesso por área).
insert into public.neg_colunas(id, quadro, nome, cor, ordem, gatilho, area) values
  ('lic_triagem',    'licitacao', 'Triagem (go / no-go)',      '#8a5a2b', 1, false, 'comercial'),
  ('lic_edital',     'licitacao', 'Analisar edital',           '#2f6f9f', 2, false, 'engenharia'),
  ('lic_orcar',      'licitacao', 'Orçar / montar proposta',   '#2f6f9f', 3, false, 'engenharia'),
  ('lic_habilit',    'licitacao', 'Habilitação (documentos)',  '#6a4fb3', 4, false, 'adm'),
  ('lic_enviada',    'licitacao', 'Proposta enviada',          '#8a5a2b', 5, false, 'comercial'),
  ('lic_disputa',    'licitacao', 'Disputa / aguardando',      '#b7791f', 6, false, 'comercial'),
  ('lic_ganhou',     'licitacao', 'Ganhou · contrato',         '#1f8a4c', 7, false, 'adm'),
  ('lic_execucao',   'licitacao', 'Execução',                  '#1f8a4c', 8, false, 'obras'),
  ('lic_perdeu',     'licitacao', 'Perdeu / desistiu',         '#b3261e', 9, false, 'comercial')
on conflict (id) do nothing;

-- Vínculo: cada edital abre no máximo um negócio.
alter table orcarede.licitacao_editais
  add column if not exists negocio_id uuid unique references public.negocios(id) on delete set null;
grant update (negocio_id) on orcarede.licitacao_editais to authenticated;
