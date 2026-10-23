// Exporta todo o banco do Supabase (e, opcionalmente, os arquivos) para a pasta ./saida
// Uso: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node backup.mjs [--arquivos]
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) { console.error("Faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."); process.exit(1); }
const H = { apikey: KEY, Authorization: "Bearer " + KEY };
const TABELAS = ["perfis", "colunas", "obras", "obra_membros", "pontos", "redes", "diario", "obra_notas"];
const SAIDA = "saida";

async function tabela(t) {
  const linhas = [];
  for (let de = 0; ; de += 1000) {
    const r = await fetch(`${URL_}/rest/v1/${t}?select=*`, { headers: { ...H, Range: `${de}-${de + 999}`, "Range-Unit": "items" } });
    if (!r.ok) throw new Error(`${t}: HTTP ${r.status} ${await r.text()}`);
    const lote = await r.json();
    linhas.push(...lote);
    if (lote.length < 1000) break;
  }
  return linhas;
}

async function listarArquivos(bucket, prefixo = "") {
  const r = await fetch(`${URL_}/storage/v1/object/list/${bucket}`, { method: "POST", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({ prefix: prefixo, limit: 1000, offset: 0 }) });
  if (!r.ok) throw new Error(`storage: HTTP ${r.status}`);
  const itens = await r.json();
  const out = [];
  for (const it of itens) {
    const caminho = prefixo ? `${prefixo}/${it.name}` : it.name;
    if (it.id) out.push({ caminho, tamanho: it.metadata?.size ?? null, atualizado: it.updated_at });
    else out.push(...await listarArquivos(bucket, caminho));
  }
  return out;
}

const dados = { gerado_em: new Date().toISOString(), tabelas: {} };
for (const t of TABELAS) { dados.tabelas[t] = await tabela(t); console.log(`${t}: ${dados.tabelas[t].length} linhas`); }
const arquivos = await listarArquivos("obras");
dados.arquivos = arquivos;
console.log(`arquivos no armazenamento: ${arquivos.length}`);
await mkdir(SAIDA, { recursive: true });
await writeFile(join(SAIDA, "banco.json"), JSON.stringify(dados));

if (process.argv.includes("--arquivos")) {
  for (const a of arquivos) {
    const r = await fetch(`${URL_}/storage/v1/object/obras/${a.caminho.split("/").map(encodeURIComponent).join("/")}`, { headers: H });
    if (!r.ok) { console.warn("falhou:", a.caminho, r.status); continue; }
    const destino = join(SAIDA, "arquivos", a.caminho);
    await mkdir(dirname(destino), { recursive: true });
    await writeFile(destino, Buffer.from(await r.arrayBuffer()));
  }
  console.log("arquivos baixados.");
}
