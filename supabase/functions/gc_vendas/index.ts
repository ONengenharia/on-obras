// Sincroniza as vendas CONCRETIZADAS do Gestão Click (ON Elétrica e ON Solar = lojas da mesma conta) para public.metas_vendas.
// Só administradores. Chaves nos segredos do Supabase (GC_ACCESS_TOKEN / GC_SECRET_TOKEN).
// Fonte implantada no Supabase como função "gc_vendas" (verify_jwt = true).
// Lê /lojas, /situacoes_vendas (nome ~ "concretiz") e /vendas?situacao_id&data_inicio&data_fim&limit&pagina;
// classifica por nome da loja (solar / elétrica); insere novas, atualiza alteradas e remove as que saíram de "Concretizada".
