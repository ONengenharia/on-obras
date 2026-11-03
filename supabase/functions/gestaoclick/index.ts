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

  const tok = Deno.env.get("GC_ACCESS_TOKEN"), sec = Deno.env.get("GC_SECRET_TOKEN");
  if (!tok) return out({ erro: "GC_ACCESS_TOKEN não configurado" }, 500);
  const h: Record<string, string> = { "access-token": tok, "Content-Type": "application/json" };
  if (sec) h["secret-access-token"] = sec;

  const b = await req.json().catch(() => ({}));
  if (b.acao === "clientes_listar") {
    const q = new URLSearchParams({ limit: String(Math.min(+b.limite || 5, 50)) });
    if (b.nome) q.set("nome", String(b.nome));
    if (b.cpf_cnpj) q.set("cpf_cnpj", String(b.cpf_cnpj));
    const r = await fetch(`${BASE}/clientes?${q}`, { headers: h });
    const t = await r.text(); let j: unknown = t; try { j = JSON.parse(t) } catch (_) {}
    return out({ status: r.status, dados: j });
  }
  return out({ erro: "Ação desconhecida" }, 400);
});
