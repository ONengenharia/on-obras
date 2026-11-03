// Ponte com a API do Gestão Click. As chaves ficam nos segredos do Supabase (GC_ACCESS_TOKEN e, se houver, GC_SECRET_TOKEN);
// só usuários logados do painel podem chamar. Etapa 1: teste de leitura de clientes.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
const BASE = Deno.env.get("GC_BASE_URL") || "https://api.gestaoclick.com";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Content-Type": "application/json" };
const out = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: cors });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const auth = req.headers.get("Authorization") || "";
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: u } = await sb.auth.getUser();
  if (!u?.user) return out({ erro: "Não autenticado" }, 401);
  const { data: ok } = await sb.schema("orcarede").rpc("eh_usuario");
  if (!ok) return out({ erro: "Sem permissão" }, 403);

  const b = await req.json().catch(() => ({}));
  const solar = b.empresa === "solar";
  const tok = Deno.env.get("GC_ACCESS_TOKEN"), sec = Deno.env.get("GC_SECRET_TOKEN");
  if (!tok) return out({ erro: "GC_ACCESS_TOKEN não configurado" }, 500);
  const h: Record<string, string> = { "access-token": tok, "Content-Type": "application/json" };
  if (sec) h["secret-access-token"] = sec;

  if (b.acao === "clientes_listar") {
    const q = new URLSearchParams({ limit: String(Math.min(+b.limite || 5, 50)) });
    if (b.nome) q.set("nome", String(b.nome));
    if (b.cpf_cnpj) q.set("cpf_cnpj", String(b.cpf_cnpj));
    const r = await fetch(`${BASE}/clientes?${q}`, { headers: h });
    const t = await r.text(); let j: unknown = t; try { j = JSON.parse(t) } catch (_) {}
    return out({ status: r.status, dados: j });
  }
  const montar = (c: Record<string, string>) => {
    const doc = String(c.doc || "").replace(/\D/g, "");
    const tipo = c.tipo_pessoa || (doc.length === 14 ? "PJ" : "PF");
    const corpo: Record<string, unknown> = { tipo_pessoa: tipo, nome: String(c.nome || "").trim() };
    if (tipo === "PJ") { corpo.razao_social = c.razao || corpo.nome; if (doc) corpo.cnpj = doc; } else if (doc) corpo.cpf = doc;
    if (c.email) corpo.email = c.email;
    const fone = String(c.fone || "").replace(/\D/g, "");
    if (fone) corpo.celular = fone;
    if (c.endereco || c.cep || c.cidade) corpo.enderecos = [{ endereco: { cep: c.cep || "", logradouro: c.endereco || "", numero: c.numero || "", bairro: c.bairro || "", nome_cidade: c.cidade || "", estado: c.uf || "" } }];
    return corpo;
  };
  if (b.acao === "cliente_atualizar") {
    const gid = String(b.gc_id || "").replace(/\D/g, "");
    if (!gid || !String(b.cliente?.nome || "").trim()) return out({ erro: "Dados incompletos" }, 400);
    const r = await fetch(`${BASE}/clientes/${gid}`, { method: "PUT", headers: h, body: JSON.stringify(montar(b.cliente)) });
    const j = await r.json().catch(() => null);
    if (!r.ok) return out({ ok: false, status: r.status, resposta: j }, 200);
    return out({ ok: true, id: gid });
  }
  if (b.acao === "ler") { // diagnóstico: só GET em recursos conhecidos
    const rec = String(b.recurso || "");
    if (!/^(clientes|orcamentos|situacoes_orcamentos|produtos|servicos|vendedores|formas_pagamentos|centros_custos|lojas|contas_bancarias|situacoes_vendas|vendas)(\/\d+)?$/.test(rec)) return out({ erro: "Recurso não permitido" }, 400);
    const r = await fetch(`${BASE}/${rec}?limite=${Math.min(+b.limite || 1, 5)}`, { headers: h });
    const t = await r.text(); let j: unknown = t; try { j = JSON.parse(t) } catch (_) {}
    return out({ status: r.status, dados: j });
  }
  if (b.acao === "cliente_enviar") {
    const c = b.cliente || {};
    const nome = String(c.nome || "").trim();
    if (!nome) return out({ erro: "Informe o nome do cliente" }, 400);
    const doc = String(c.doc || "").replace(/\D/g, "");
    const tipo = c.tipo_pessoa || (doc.length === 14 ? "PJ" : "PF");
    const norm = (x: unknown) => String(x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const achar = async (qs: Record<string, string>) => {
      const r = await fetch(`${BASE}/clientes?${new URLSearchParams({ ...qs, limit: "10" })}`, { headers: h });
      const j = await r.json().catch(() => null);
      return (j?.data || []) as Record<string, string>[];
    };
    // 1) já existe? (por CPF/CNPJ; sem documento, por nome idêntico)
    let ja: Record<string, string> | undefined;
    if (doc) ja = (await achar({ cpf_cnpj: doc })).find((x) => String(x.cpf || x.cnpj || "").replace(/\D/g, "") === doc);
    else ja = (await achar({ nome })).find((x) => norm(x.nome) === norm(nome));
    if (ja) return out({ ok: true, novo: false, id: ja.id });
    const r = await fetch(`${BASE}/clientes`, { method: "POST", headers: h, body: JSON.stringify(montar(c)) });
    const j = await r.json().catch(() => null);
    const id = j?.data?.id ?? j?.id;
    if (!r.ok || !id) return out({ ok: false, status: r.status, resposta: j }, 200);
    return out({ ok: true, novo: true, id });
  }
  if (b.acao === "orcamento_criar" || b.acao === "orcamento_atualizar") {
    const o = b.orc || {};
    const norm = (x: unknown) => String(x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    const gj = async (path: string) => { const r = await fetch(`${BASE}/${path}`, { headers: h }); return await r.json().catch(() => null); };
    // vendedor = usuário logado (casa pelo nome)
    const { data: us } = await sb.from("usuarios").select("nome,email").eq("id", u.user.id).maybeSingle();
    const vj = await gj("vendedores?limite=100");
    const vend = (vj?.data || []) as Record<string, string>[];
    const meu = norm(us?.nome);
    const v = vend.find((x) => norm(x.nome) === meu) || vend.find((x) => meu && (norm(x.nome).includes(meu) || meu.includes(norm(x.nome))));
    // sem vendedor correspondente: segue sem vendedor (opcional)
    // serviço de mão de obra com código padrão ON-
    const slug = (x: string) => norm(x).toUpperCase().replace(/ /g, "-").slice(0, 40) || "OBRA";
    const alvo = (+o.total > 0 || !(+o.mao > 0)) ? null : { codigo: "ON-MAO-DE-OBRA", nome: "MÃO DE OBRA", valor: +o.mao };
    let srv: Record<string, string> | undefined;
    if (alvo) {
      srv = ((await gj(`servicos?codigo=${encodeURIComponent(alvo.codigo)}`))?.data || []).find((x: Record<string, string>) => x.codigo === alvo.codigo);
      if (!srv) {
        const r = await fetch(`${BASE}/servicos`, { method: "POST", headers: h, body: JSON.stringify({ codigo: alvo.codigo, nome: alvo.nome, valor_venda: "0.00" }) });
        const j = await r.json().catch(() => null);
        if (!r.ok || !(j?.data?.id ?? j?.id)) return out({ ok: false, etapa: "servico", status: r.status, resposta: j });
        srv = { id: String(j?.data?.id ?? j?.id), nome: alvo.nome };
      }
    }
    // mesma conta; a empresa (loja) é escolhida pelo nome
    const sitId = "7221156", prod = { id: "72926677", vid: "123633552", tv: "519224" as string | undefined };
    let ccId: string | undefined = "513555", lojaId: string | undefined;
    const lj = ((await gj("lojas?limite=50"))?.data || []) as Record<string, string>[];
    const loja = lj.find((x) => solar ? /solar/i.test(norm(x.nome) + norm(x.razao_social)) : /el.trica|eletrica/i.test(norm(x.nome) + norm(x.razao_social)));
    if (lj.length > 1 && !loja) return out({ ok: false, erro: "Não achei a empresa " + (solar ? "Solar" : "Elétrica") + " no Gestão Click. Empresas: " + lj.map((x) => x.nome).join(", ") });
    lojaId = loja?.id;
    if (solar) { const cl = ((await gj("centros_custos?limite=50"))?.data || []) as Record<string, string>[]; ccId = cl.find((x) => /solar/i.test(x.nome))?.id || ccId; }
    const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
    const money = (n: number) => (Math.round((+n || 0) * 100) / 100).toFixed(2);
    const corpo: Record<string, unknown> = {
      cliente_id: String(o.cliente_gc_id), ...(v ? { vendedor_id: v.id } : {}), situacao_id: sitId, ...(lojaId ? { loja_id: lojaId } : {}), ...(ccId ? { centro_custo_id: ccId } : {}),
      data: hoje, previsao_entrega: hoje, validade: "30 DIAS", introducao: String(o.ref || ""),
      produtos: (+o.total > 0 || +o.material > 0) ? [{ produto: { produto_id: prod.id, ...(prod.vid ? { variacao_id: prod.vid } : {}), nome_produto: "MATERIAIS GERAIS", detalhes: +o.total > 0 ? [String(o.tipo || "").toUpperCase(), String(o.titulo || "")].filter(Boolean).join(" · ") : String(o.titulo || ""), quantidade: "1", ...(prod.tv ? { tipo_valor_id: prod.tv } : {}), valor_venda: money(+o.total > 0 ? +o.total : +o.material), tipo_desconto: "R$", desconto_valor: "" } }] : [],
      servicos: srv ? [{ servico: { servico_id: srv.id, nome_servico: alvo!.nome, detalhes: String(o.titulo || ""), quantidade: "1", valor_venda: money(alvo!.valor), tipo_desconto: "R$", desconto_valor: "" } }] : [],
    };
    const atualizar = b.acao === "orcamento_atualizar";
    const gid = String(o.gc_id || "").replace(/\D/g, "");
    if (atualizar && !gid) return out({ erro: "Sem código do orçamento" }, 400);
    const r = await fetch(atualizar ? `${BASE}/orcamentos/${gid}` : `${BASE}/orcamentos`, { method: atualizar ? "PUT" : "POST", headers: h, body: JSON.stringify(corpo) });
    const j = await r.json().catch(() => null);
    const id = j?.data?.id ?? j?.id ?? (atualizar ? gid : undefined);
    if (!r.ok || !id) return out({ ok: false, status: r.status, resposta: j, enviado: corpo });
    return out({ ok: true, id: String(id), codigo: String(j?.data?.codigo ?? j?.codigo ?? ""), vendedor: v?.nome || "" });
  }
  return out({ erro: "Ação desconhecida" }, 400);
});
