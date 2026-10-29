// Camada de dados compartilhada pelo kanban (index.html) e pelo painel da obra (obra.html)
(function () {
  const C = window.ON_CONFIG;
  const sb = window.supabase.createClient(C.url, C.key, { auth: { persistSession: true, autoRefreshToken: true } });

  const COLUNAS = [
    { id: "compras", nome: "Compras" },
    { id: "liberado", nome: "Liberado para execução" },
    { id: "andamento", nome: "Em andamento de obra" },
    { id: "finalizado", nome: "Finalizado" }
  ];

  // Modelo de dados de uma obra nova
  const DADOS_PADRAO = () => ({
    mapUrl: "", mapW: 4000, mapH: 3000, pxm: 150 / 25.4,
    clienteLogo: "",
    obra: { projeto: "", lotes: "", tensao: "", concessionaria: "", rt: "", mapsLink: "", coord: "" },
    quant: [
      { id: "q1", nome: "Rede MT", spec: "", un: "m", prev: 0, exec: 0, auto: "MT" },
      { id: "q2", nome: "Rede BT 3×50", spec: "", un: "m", prev: 0, exec: 0, auto: "BT50" },
      { id: "q3", nome: "Rede BT 3×70", spec: "", un: "m", prev: 0, exec: 0, auto: "BT70" },
      { id: "q4", nome: "Postes", spec: "", un: "un", prev: 0, exec: 0, auto: "postes" },
      { id: "q5", nome: "Transformadores", spec: "", un: "un", prev: 0, exec: 0, auto: "trafo" },
      { id: "q6", nome: "Luminárias", spec: "", un: "un", prev: 0, exec: 0, auto: "lum" }
    ],
    marcos: [
      { id: "m1", nome: "Emissão do projeto", data: "", pct: 0, link: "" },
      { id: "m2", nome: "Aprovação na distribuidora", data: "", pct: 0, link: "" },
      { id: "m3", nome: "Mobilização", data: "", pct: 0, link: "" },
      { id: "m4", nome: "Implantação de postes", data: "", pct: 0, link: "q4" },
      { id: "m5", nome: "Lançamento rede MT", data: "", pct: 0, link: "q1" },
      { id: "m6", nome: "Lançamento rede BT", data: "", pct: 0, link: "BT" },
      { id: "m7", nome: "Transformadores", data: "", pct: 0, link: "q5" },
      { id: "m8", nome: "Iluminação pública", data: "", pct: 0, link: "q6" },
      { id: "m9", nome: "Vistoria e energização", data: "", pct: 0, link: "" }
    ],
    mats: [], anexos: [], linkMig: 1
  });

  const pontoDeLinha = r => ({ id: r.id, x: r.x, y: r.y, tipo: r.tipo, titulo: r.titulo || "", status: r.status, data: r.data || "", nota: r.nota || "",
    lum: !!r.lum, trafo: !!r.trafo, trafoId: r.trafo_id || "", chave: !!r.chave, pr: !!r.pr, aterr: !!r.aterr, fotos: r.fotos || [] });
  const linhaDePonto = (o, p, uid) => ({ obra_id: o, id: p.id, x: p.x, y: p.y, tipo: p.tipo || "Poste", titulo: p.titulo || "", status: p.status || "executado",
    data: p.data || null, nota: p.nota || "", lum: !!p.lum, trafo: !!p.trafo, trafo_id: p.trafoId || "", chave: !!p.chave, pr: !!p.pr, aterr: !!p.aterr,
    fotos: p.fotos || [], autor: uid, atualizado_em: new Date().toISOString() });
  const redeDeLinha = r => ({ id: r.id, tipo: r.tipo, bt: r.bt || "", a: r.a, b: r.b, status: r.status, data: r.data || "" });
  const linhaDeRede = (o, g, uid) => ({ obra_id: o, id: g.id, tipo: g.tipo, bt: g.bt || "", a: g.a, b: g.b, status: g.status || "executado", data: g.data || null, autor: uid, atualizado_em: new Date().toISOString() });
  const logDeLinha = r => ({ id: r.id, data: r.data || "", ts: r.ts || "", texto: r.texto || "", fotos: r.fotos || [] });
  const linhaDeLog = (o, l, uid) => ({ obra_id: o, id: l.id, data: l.data || new Date().toISOString().slice(0, 10), ts: l.ts || "", texto: l.texto || "", fotos: l.fotos || [], autor: uid });

  async function sessao() { const { data } = await sb.auth.getSession(); return data.session; }
  async function meuPerfil() {
    const s = await sessao(); if (!s) return null;
    const { data } = await sb.from("perfis").select("*").eq("id", s.user.id).single();
    return data;
  }

  // ---------- painel da obra ----------
  let ctx = null; // { obraId, token, role, uid, snap:{pontos:Set, redes:Set, log:Set} }

  async function carregarObra() {
    const q = new URLSearchParams(location.search);
    const token = q.get("t"), id = q.get("id");
    let base, pontos, redes, diario, role = "cliente", uid = null;
    if (token) {
      const { data, error } = await sb.rpc("obra_publica", { t: token });
      if (error || !data) throw new Error("Link inválido ou obra removida.");
      base = data.obra; pontos = data.pontos; redes = data.redes; diario = data.diario;
    } else if (id) {
      const s = await sessao();
      if (!s) { location.href = "index.html?volta=" + encodeURIComponent(location.pathname + location.search); throw new Error("login"); }
      uid = s.user.id;
      const perfil = await meuPerfil();
      const r1 = await sb.from("obras").select("*").eq("id", id).single();
      if (r1.error || !r1.data) throw new Error("Você não tem acesso a esta obra.");
      base = r1.data;
      const [rp, rr, rd] = await Promise.all([
        sb.from("pontos").select("*").eq("obra_id", id),
        sb.from("redes").select("*").eq("obra_id", id),
        sb.from("diario").select("*").eq("obra_id", id)
      ]);
      pontos = rp.data || []; redes = rr.data || []; diario = rd.data || [];
      role = perfil && perfil.papel === "admin" ? "admin" : "executor";
    } else throw new Error("Obra não informada.");

    const d = Object.assign(DADOS_PADRAO(), base.dados || {});
    d.obra = Object.assign({}, DADOS_PADRAO().obra, (base.dados || {}).obra || {}, { titulo: base.titulo, cliente: base.cliente, local: base.local });
    d.pontos = pontos.map(pontoDeLinha);
    d.redes = redes.map(redeDeLinha);
    d.log = diario.map(logDeLinha);
    d.atualizado = (base.atualizado_em || "").slice(0, 10);
    ctx = { link0: (d.obra && d.obra.mapsLink) || "", obraId: base.id, token: base.token || token, role, uid, coluna: base.coluna,
      snap: { pontos: new Set(d.pontos.map(p => p.id)), redes: new Set(d.redes.map(g => g.id)), log: new Set(d.log.map(l => l.id)) } };
    return { S: d, role, token: ctx.token };
  }

  async function salvar(S, avanco) {
    if (!ctx || ctx.role === "cliente") throw new Error("Sem permissão para salvar.");
    const o = ctx.obraId, uid = ctx.uid;
    const ids = { pontos: new Set(S.pontos.map(p => p.id)), redes: new Set(S.redes.map(g => g.id)), log: new Set(S.log.map(l => l.id)) };
    const chk = r => { if (r.error) throw r.error; };
    // pontos antes das redes (as redes apontam para os pontos)
    if (S.pontos.length) chk(await sb.from("pontos").upsert(S.pontos.map(p => linhaDePonto(o, p, uid))));
    if (S.redes.length) chk(await sb.from("redes").upsert(S.redes.map(g => linhaDeRede(o, g, uid))));
    if (S.log.length) chk(await sb.from("diario").upsert(S.log.map(l => linhaDeLog(o, l, uid))));
    for (const [tab, col] of [["redes", "redes"], ["pontos", "pontos"], ["diario", "log"]]) {
      const rem = [...ctx.snap[col]].filter(x => !ids[col].has(x) && (col !== "log" || (window.__logDel && window.__logDel.has(x))));
      if (rem.length) chk(await sb.from(tab).delete().eq("obra_id", o).in("id", rem));
    }
    if (ctx.role === "admin") {
      const { pontos, redes, log, atualizado, obra, ...resto } = S;
      const { titulo, cliente, local, ...obraResto } = obra;
      const upd = { titulo, cliente, local, dados: Object.assign({}, resto, { obra: obraResto }), avanco };
      if ((obraResto.mapsLink || "") !== ctx.link0) { upd.lat = null; upd.lng = null; } // a tela inicial relocaliza pelo link novo
      chk(await sb.from("obras").update(upd).eq("id", o));
      ctx.link0 = obraResto.mapsLink || "";
    } else {
      chk(await sb.rpc("registrar_avanco", { o, pct: avanco }));
    }
    ctx.snap = ids;
  }

  async function upload(blob, nome) {
    if (!ctx || ctx.role === "cliente") throw new Error("Sem permissão.");
    const ext = (nome && /\.[a-z0-9]{1,5}$/i.test(nome) ? nome.split(".").pop() : (blob.type.split("/")[1] || "bin")).toLowerCase().replace("jpeg", "jpg");
    const path = ctx.obraId + "/" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + "." + ext;
    const { error } = await sb.storage.from(C.bucket).upload(path, blob, { contentType: blob.type || "application/octet-stream", upsert: false });
    if (error) throw error;
    return sb.storage.from(C.bucket).getPublicUrl(path).data.publicUrl;
  }

  function linkCliente(token) { return new URL("obra.html?t=" + token, location.href).href; }

  window.DB = { sb, COLUNAS, DADOS_PADRAO, sessao, meuPerfil, carregarObra, salvar, upload, linkCliente, ctx: () => ctx };
})();
