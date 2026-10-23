// Recursos presentes em todas as telas internas: chat geral da equipe e alerta de lembretes.
(async function () {
  if (!window.DB) return;
  if (new URLSearchParams(location.search).get("t")) return; // link do cliente: nada disso aparece
  const sb = DB.sb;
  const sess = await DB.sessao();
  if (!sess) return;
  const eu = sess.user.id;
  const perfil = await DB.meuPerfil();
  if (!perfil || perfil.papel === "pendente") return;

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const PAL = ["#2f6f9f", "#6a4fb3", "#00897b", "#c2185b", "#d18b16", "#5d6b78", "#1f8a4c", "#8c6d1f", "#1565c0", "#ad1457"];
  const corDe = id => { let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return PAL[h % PAL.length]; };
  const sigla = n => String(n || "?").trim().split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join("") || "?";
  const fdt = d => new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  const css = document.createElement("style");
  css.textContent = `
  .gc-fab{position:fixed;right:calc(18px + env(safe-area-inset-right,0px));bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:1200;width:56px;height:56px;border-radius:50%;border:0;background:#1e2f40;color:#fff;font-size:24px;box-shadow:0 6px 20px rgba(0,0,0,.35);cursor:pointer;display:grid;place-items:center}
  .gc-fab:hover{background:#2b4157}
  .gc-dot{position:absolute;top:-2px;right:-2px;min-width:22px;height:22px;border-radius:11px;background:#d32f2f;color:#fff;font:700 12px/22px Montserrat,system-ui,sans-serif;padding:0 6px;box-shadow:0 0 0 3px #fff;animation:gcPisca 1s infinite}
  @keyframes gcPisca{50%{transform:scale(1.18);background:#ff5252}}
  @media (prefers-reduced-motion:reduce){.gc-dot{animation:none}}
  .gc-win{position:fixed;right:calc(18px + env(safe-area-inset-right,0px));bottom:calc(86px + env(safe-area-inset-bottom,0px));z-index:1200;width:min(380px,calc(100vw - 24px));height:min(560px,calc(100vh - 120px));background:var(--panel,#fff);color:var(--ink,#1e2f40);border:1px solid var(--line,#d6e1ea);border-radius:14px;box-shadow:0 14px 40px rgba(0,0,0,.3);display:flex;flex-direction:column;overflow:hidden;font-family:Montserrat,system-ui,sans-serif}
  .gc-top{background:#1e2f40;color:#e8f1f9;padding:10px 12px;display:flex;gap:8px;align-items:center}
  .gc-top b{flex:1;font-size:14px}.gc-top button{background:none;border:0;color:#cfe0ee;font-size:18px;cursor:pointer}
  .gc-top select{background:#2b4157;color:#e8f1f9;border:1px solid #3b5670;border-radius:7px;padding:5px 6px;font:inherit;font-size:12.5px;max-width:190px}
  .gc-list{flex:1;overflow:auto;padding:10px;display:grid;gap:8px;align-content:start;background:var(--bg,#eef2f6)}
  .gc-m{display:grid;grid-template-columns:28px 1fr;gap:7px}.gc-m .av{width:28px;height:28px;border-radius:50%;color:#fff;display:grid;place-items:center;font-size:10px;font-weight:700}
  .gc-m .b{background:var(--panel,#fff);border:1px solid var(--line,#d6e1ea);border-radius:10px;padding:6px 9px;font-size:13px;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere}
  .gc-m .b small{display:block;font-size:10.5px;color:var(--muted,#5a6f83)}.gc-m .b small b{color:var(--ink,#1e2f40)}
  .gc-m.eu .b{background:var(--accent-soft,#e8f1f9);border-color:transparent}
  .gc-m .men{color:var(--accent,#2f6f9f);font-weight:700}
  .gc-comp{display:flex;gap:6px;padding:8px;border-top:1px solid var(--line,#d6e1ea);position:relative}
  .gc-comp textarea{flex:1;resize:none;height:42px;border:1px solid var(--line,#d6e1ea);border-radius:8px;padding:8px;font:inherit;font-size:13px;background:var(--bg,#eef2f6);color:inherit}
  .gc-comp button{border:0;border-radius:8px;background:#2f6f9f;color:#fff;font-weight:600;padding:0 14px;cursor:pointer}
  .gc-ment{position:absolute;left:8px;bottom:calc(100% + 4px);width:calc(100% - 16px);background:var(--panel,#fff);border:1px solid var(--line,#d6e1ea);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.2);padding:4px;display:grid;gap:2px;max-height:220px;overflow:auto}
  .gc-win{width:min(600px,calc(100vw - 24px))!important}
  .gc-body{flex:1;display:flex;min-height:0}
  .gc-main{flex:1;display:flex;flex-direction:column;min-width:0}
  .gc-chans{width:170px;flex:none;overflow-y:auto;background:#26394c;display:flex;flex-direction:column;gap:2px;padding:6px}
  .gc-ch{display:flex;align-items:center;gap:8px;border:0;background:none;color:#e8f1f9;border-radius:8px;padding:7px 8px;font:600 12.5px Montserrat,system-ui,sans-serif;cursor:pointer;text-align:left;width:100%}
  .gc-ch:hover{background:#2b4157}
  .gc-ch.on{background:#e8f1f9;color:#1e2f40}
  .gc-ch .av{width:26px;height:26px;flex:none;border-radius:50%;color:#fff;display:grid;place-items:center;font-size:10px;font-weight:700}
  .gc-ch span.nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .gc-ch.nl span.nm{font-weight:800}
  .gc-ch i{font-style:normal;margin-left:auto;background:#d32f2f;color:#fff;border-radius:9px;padding:0 6px;font-size:10.5px;animation:gcPisca 1s infinite}
  .gc-ch i.men{background:#b71c1c;box-shadow:0 0 0 2px #ffcdd2}
  @keyframes gcPisca{50%{background:#ff5252;transform:scale(1.15)}}
  @media (prefers-reduced-motion:reduce){.gc-ch i{animation:none}}
  @media (max-width:520px){.gc-chans{width:96px}.gc-ch span.nm{font-size:11px}}
  .gc-m.eu{grid-template-columns:1fr}
  .gc-m.eu .av{display:none}
  .gc-m.eu .b{justify-self:end;max-width:85%;background:#2f6f9f;color:#fff;border-color:#2f6f9f;border-radius:12px 12px 2px 12px}
  .gc-m.eu .b small{color:#d7e8f5;text-align:right}.gc-m.eu .b small b{color:#fff}
  .gc-m.eu .men{color:#fff;text-decoration:underline}
  .gc-m:not(.eu) .b{justify-self:start;max-width:85%;border-radius:12px 12px 12px 2px}
  .gc-ment[hidden],.gc-win[hidden],.gc-emo[hidden]{display:none!important}
  .gc-top button{padding:2px 6px;border-radius:6px}.gc-top button:hover{background:#2b4157;color:#fff}
  .gc-eb{background:none!important;color:inherit!important;font-size:20px;padding:0 4px!important}
  .gc-emo{position:absolute;left:8px;bottom:calc(100% + 4px);width:calc(100% - 16px);background:var(--panel,#fff);border:1px solid var(--line,#d6e1ea);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.2);padding:6px;display:grid;grid-template-columns:repeat(8,1fr);gap:2px;max-height:200px;overflow:auto}
  .gc-emo button{border:0;background:none;font-size:20px;padding:4px;border-radius:6px;cursor:pointer}.gc-emo button:hover{background:var(--accent-soft,#e8f1f9)}
  .gc-ment button{display:flex;gap:8px;align-items:center;text-align:left;border:0;background:none;border-radius:7px;padding:6px 8px;font:inherit;font-size:13px;color:inherit;cursor:pointer}
  .gc-ment button.on,.gc-ment button:hover{background:var(--accent-soft,#e8f1f9)}
  .gc-ment .av{width:22px;height:22px;border-radius:50%;color:#fff;display:grid;place-items:center;font-size:9px;font-weight:700}
  .gc-vazio{color:var(--muted,#5a6f83);font-size:12.5px;text-align:center;padding:20px}
  .lb-ov{position:fixed;inset:0;z-index:1300;background:rgba(10,16,22,.65);display:grid;place-items:center;padding:16px;font-family:Montserrat,system-ui,sans-serif}
  .lb-box{background:#fff;color:#1e2f40;border-radius:18px;padding:24px;width:min(560px,100%);display:grid;gap:12px;box-shadow:0 20px 60px rgba(0,0,0,.45);border-top:10px solid #d18b16;animation:lbEntra .35s ease-out}
  @keyframes lbEntra{from{transform:scale(.85);opacity:0}}
  .lb-box .ic{font-size:44px;line-height:1;animation:lbSino 1.2s infinite}
  @keyframes lbSino{0%,100%{transform:rotate(0)}10%{transform:rotate(14deg)}20%{transform:rotate(-12deg)}30%{transform:rotate(8deg)}40%{transform:rotate(0)}}
  @media (prefers-reduced-motion:reduce){.lb-box,.lb-box .ic{animation:none}}
  .lb-box h2{margin:0;font-size:24px;line-height:1.2}.lb-box .card{font-size:14px;color:#5a6f83}.lb-box .tx{font-size:18px;font-weight:600;white-space:pre-wrap}
  .lb-box .qt{font-size:12.5px;color:#b3261e;font-weight:700}
  .lb-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}
  .lb-acts button,.lb-acts a{border:1px solid #d6e1ea;background:#fff;border-radius:9px;padding:10px 14px;font:600 14px Montserrat,system-ui,sans-serif;color:#1e2f40;cursor:pointer;text-decoration:none}
  .lb-acts .pri{background:#2f6f9f;border-color:#2f6f9f;color:#fff}.lb-acts .ok{background:#1f8a4c;border-color:#1f8a4c;color:#fff}
  .lb-mais{font-size:12.5px;color:#5a6f83}`;
  document.head.appendChild(css);

  /* ---------------- chat geral ---------------- */
  const { data: pes } = await sb.from("perfis").select("id,nome,email,papel,setor").order("nome");
  const U = (pes || []).filter(u => u.papel !== "pendente").map(u => ({ ...u, nome: u.nome || u.email }));
  const nomeDe = id => (U.find(u => u.id === id) || {}).nome || "";
  const dm = outro => "dm:" + [eu, outro].sort().join(":");
  let canal = (() => { try { return localStorage.getItem("gc.canal") || "geral"; } catch (e) { return "geral"; } })();
  const EMO = "😀 😂 😊 😍 😉 😎 🤔 😅 😢 😡 👍 👎 👏 🙏 💪 🤝 ✅ ❌ ⚠️ ❗ ❓ 🔥 ⭐ 🎉 ⚡ 🔌 💡 ☀️ 🏗️ 🚧 🔧 🛠️ 📍 📅 ⏰ 📞 📎 📄 💰 🚚".split(" ");
  let aberto = false, msgs = [], naoLidas = {}, timer = null;

  const fab = document.createElement("button");
  fab.className = "gc-fab"; fab.title = "Chat da equipe"; fab.setAttribute("aria-label", "Chat da equipe");
  fab.innerHTML = "💬"; document.body.appendChild(fab);
  const win = document.createElement("div"); win.className = "gc-win"; win.hidden = true; document.body.appendChild(win);

  function totalNaoLidas() { return Object.values(naoLidas).reduce((a, x) => a + x.qtd, 0); }
  function pintarFab() {
    const t = totalNaoLidas();
    fab.innerHTML = "💬" + (t ? `<span class="gc-dot">${t > 99 ? "99+" : t}</span>` : "");
  }
  async function contar() {
    const { data } = await sb.rpc("chat_nao_lidas");
    naoLidas = {}; (data || []).forEach(r => naoLidas[r.canal] = { qtd: +r.qtd, men: +r.mencoes });
    pintarFab();
  }
  async function marcarLido() {
    await sb.from("chat_lidos").upsert({ user_id: eu, canal, lido_em: new Date().toISOString() });
    delete naoLidas[canal]; pintarFab();
  }
  async function carregar() {
    const { data } = await sb.from("chat_msgs").select("*").eq("canal", canal).order("criado_em", { ascending: false }).limit(150);
    msgs = (data || []).reverse();
  }
  const chips = () => { const L = [{ c: "geral", n: "# Geral" }, ...U.filter(u => u.id !== eu).map(u => ({ c: dm(u.id), n: u.nome.split(" ")[0] + (u.nome.includes(" ") ? " " + u.nome.split(" ").slice(-1)[0][0] + "." : ""), t: u.nome }))];
    L.sort((a, b) => (a.c === "geral" ? -2 : 0) - (b.c === "geral" ? -2 : 0) || ((naoLidas[b.c] || {}).qtd || 0) - ((naoLidas[a.c] || {}).qtd || 0));
    return L.map(x => { const n = naoLidas[x.c]; const uid = x.c === "geral" ? null : x.c.split(":").find(k => k !== "dm" && k !== eu); return `<button class="gc-ch ${canal === x.c ? "on" : ""} ${n ? "nl" : ""}" data-c="${x.c}" title="${esc(x.t || "Conversa de toda a equipe")}${n ? " · " + n.qtd + " não lida(s)" + (n.men ? ", com menção" : "") : ""}">${uid ? `<span class="av" style="background:${corDe(uid)}">${sigla(x.t)}</span>` : `<span class="av" style="background:#2f6f9f">#</span>`}<span class="nm">${esc(x.c === "geral" ? "Geral" : x.t)}</span>${n ? `<i class="${n.men ? "men" : ""}">${n.men ? "@" : ""}${n.qtd}</i>` : ""}</button>`; }).join(""); };
  function bindChips() { win.querySelectorAll(".gc-ch").forEach(b => b.onclick = async () => { canal = b.dataset.c; try { localStorage.setItem("gc.canal", canal); } catch (er) {} await carregar(); desenharLista(); await marcarLido(); win.querySelector(".gc-chans").innerHTML = chips(); bindChips(); }); }
  const opcoesCanal = () => `<option value="geral" ${canal === "geral" ? "selected" : ""}># Geral (todos)${naoLidas.geral ? " · " + naoLidas.geral.qtd : ""}</option>` +
    U.filter(u => u.id !== eu).map(u => { const c = dm(u.id), n = naoLidas[c]; return `<option value="${c}" ${canal === c ? "selected" : ""}>✉ ${esc(u.nome)}${n ? " · " + n.qtd : ""}</option>`; }).join("");
  function fmt(t) { let h = esc(t); U.map(u => u.nome).sort((a, b) => b.length - a.length).forEach(n => { h = h.split("@" + esc(n)).join(`<span class="men">@${esc(n)}</span>`); }); return h; }
  function desenharLista() {
    const L = win.querySelector(".gc-list");
    L.innerHTML = msgs.length ? msgs.map(m => `<div class="gc-m ${m.autor === eu ? "eu" : ""}"><span class="av" style="background:${corDe(m.autor)}">${sigla(m.autor_nome)}</span><div class="b"><small>${m.autor === eu ? "Você" : `<b>${esc(m.autor_nome)}</b>`} · ${fdt(m.criado_em)}</small>${fmt(m.texto)}</div></div>`).join("")
      : `<div class="gc-vazio">${canal === "geral" ? "Ninguém escreveu ainda. Esta conversa é de toda a equipe." : "Comece uma conversa direta com " + esc(nomeDe(canal.split(":").find(x => x !== "dm" && x !== eu))) + "."}</div>`;
    L.scrollTop = L.scrollHeight;
  }
  function montar() {
    win.innerHTML = `<div class="gc-top"><b>Chat da equipe</b><button data-x="min" title="Minimizar" aria-label="Minimizar">—</button><button data-x="fec" title="Fechar" aria-label="Fechar">✕</button></div>
      <div class="gc-body"><div class="gc-chans">${chips()}</div><div class="gc-main"><div class="gc-list"></div>
      <div class="gc-comp"><div class="gc-ment" hidden></div><div class="gc-emo" hidden>${EMO.map(e=>`<button type="button">${e}</button>`).join("")}</div><button type="button" class="gc-eb" title="Emojis" aria-label="Emojis">😊</button><textarea placeholder="Mensagem… digite @ para chamar alguém (Enter envia)"></textarea><button>Enviar</button></div></div></div>`;
    win.querySelectorAll(".gc-top [data-x]").forEach(b => b.onclick = fechar);
    const emo = win.querySelector(".gc-emo");
    win.querySelector(".gc-eb").onclick = () => { emo.hidden = !emo.hidden; };
    emo.querySelectorAll("button").forEach(b => b.onclick = () => { const t = win.querySelector("textarea"), p = t.selectionStart ?? t.value.length; t.value = t.value.slice(0, p) + b.textContent + t.value.slice(t.selectionEnd ?? p); const q = p + b.textContent.length; t.focus(); t.setSelectionRange(q, q); emo.hidden = true; });
    bindChips();
    const tx = win.querySelector("textarea"), box = win.querySelector(".gc-ment");
    autocompletar(tx, box);
    const enviar = async () => {
      const t = tx.value.trim(); if (!t) return;
      const men = U.filter(u => t.includes("@" + u.nome)).map(u => u.id);
      tx.value = "";
      const { error } = await sb.from("chat_msgs").insert({ canal, texto: t, mencoes: men });
      if (error) { tx.value = t; alertaCurto("Não foi possível enviar: " + error.message); return; }
      await carregar(); desenharLista(); marcarLido();
    };
    win.querySelector(".gc-comp > button:last-child").onclick = enviar;
    tx.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey && box.hidden) { e.preventDefault(); enviar(); } });
    desenharLista();
  }
  function autocompletar(tx, box) {
    let sel = 0, lista = [];
    const alvo = () => { const v = tx.value.slice(0, tx.selectionStart); const m = v.match(/@([^\s@]*)$/); return m ? { q: m[1].toLowerCase(), ini: v.length - m[0].length } : null; };
    const draw = () => { const a = alvo(); if (!a) { box.hidden = true; return; }
      lista = U.filter(u => u.nome.toLowerCase().split(" ").some(p => p.startsWith(a.q))); if (!lista.length) { box.hidden = true; return; }
      sel = Math.min(sel, lista.length - 1);
      box.innerHTML = lista.map((u, k) => `<button type="button" class="${k === sel ? "on" : ""}" data-k="${k}"><span class="av" style="background:${corDe(u.id)}">${sigla(u.nome)}</span>${esc(u.nome)}</button>`).join(""); box.hidden = false;
      box.querySelectorAll("[data-k]").forEach(b => b.onmousedown = e => { e.preventDefault(); pick(+b.dataset.k); }); };
    const pick = k => { const a = alvo(); if (!a) return; const u = lista[k]; const fim = tx.selectionStart; tx.value = tx.value.slice(0, a.ini) + "@" + u.nome + " " + tx.value.slice(fim); const p = a.ini + u.nome.length + 2; tx.setSelectionRange(p, p); box.hidden = true; tx.focus(); };
    tx.addEventListener("input", () => { sel = 0; draw(); });
    tx.addEventListener("keydown", e => { if (box.hidden) return;
      if (e.key === "ArrowDown") { sel = (sel + 1) % lista.length; draw(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { sel = (sel - 1 + lista.length) % lista.length; draw(); e.preventDefault(); }
      else if (e.key === "Enter" || e.key === "Tab") { pick(sel); e.preventDefault(); e.stopImmediatePropagation(); }
      else if (e.key === "Escape") box.hidden = true; });
    tx.addEventListener("blur", () => setTimeout(() => box.hidden = true, 150));
  }
  async function abrir() {
    aberto = true; win.hidden = false;
    if (!naoLidas[canal]) { const c = Object.keys(naoLidas).find(k => naoLidas[k].men) || Object.keys(naoLidas)[0]; if (c) canal = c; }
    await carregar(); montar(); await marcarLido(); win.querySelector(".gc-chans").innerHTML = chips(); bindChips(); win.querySelector("textarea").focus();
    clearInterval(timer);
    timer = setInterval(async () => { if (!aberto || document.hidden) return; const n = msgs.length && msgs[msgs.length - 1].id; await carregar(); if ((msgs.length && msgs[msgs.length - 1].id) !== n) { desenharLista(); marcarLido(); } await contar(); const sc = win.querySelector(".gc-chans"), x = sc.scrollLeft; sc.innerHTML = chips(); sc.scrollLeft = x; bindChips(); }, 5000);
  }
  function fechar() { aberto = false; win.hidden = true; clearInterval(timer); }
  fab.onclick = () => aberto ? fechar() : abrir();
  document.addEventListener("keydown", e => { if (e.key === "Escape" && aberto && !document.querySelector(".lb-ov")) fechar(); });
  document.addEventListener("mousedown", e => { if (aberto && !win.contains(e.target) && !fab.contains(e.target)) fechar(); });
  function alertaCurto(t) { const d = document.createElement("div"); d.className = "toast"; d.style.zIndex = 1400; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 3500); }
  await contar();
  setInterval(() => { if (!document.hidden && !aberto) contar(); }, 8000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) contar(); });
  window.addEventListener("focus", () => contar());
  try {
    sb.channel("on-global-" + eu)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_msgs" }, async p => {
        const m = p.new || {};
        if (aberto && m.canal === canal) { await carregar(); desenharLista(); await marcarLido(); }
        await contar();
        if (aberto) { const sc = win.querySelector(".gc-chans"); if (sc) { const x = sc.scrollLeft; sc.innerHTML = chips(); sc.scrollLeft = x; bindChips(); } }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notificacoes", filter: "user_id=eq." + eu }, p => {
        window.dispatchEvent(new CustomEvent("on:notif", { detail: p.new }));
      })
      .subscribe();
  } catch (e) {}

  /* ---------------- lembretes ---------------- */
  const adiados = new Map(); // id -> até quando não mostrar nesta sessão
  let mostrando = false;
  async function checarLembretes() {
    if (mostrando || document.hidden) return;
    const { data } = await sb.from("neg_lembretes").select("*,negocios(titulo,cliente,quadro)").eq("para", eu).eq("feito", false).lte("quando", new Date().toISOString()).order("quando");
    const L = (data || []).filter(l => !(adiados.get(l.id) > Date.now()));
    if (!L.length) return;
    mostrar(L);
  }
  function mostrar(L) {
    mostrando = true;
    const l = L[0], atraso = Date.now() - new Date(l.quando).getTime();
    const ov = document.createElement("div"); ov.className = "lb-ov"; ov.setAttribute("role", "alertdialog");
    ov.innerHTML = `<div class="lb-box"><div class="ic">⏰</div><h2>Lembrete</h2>
      <div class="tx">${esc(l.texto || "Retomar este negócio")}</div>
      <div class="card">💼 ${esc((l.negocios || {}).titulo || "Negócio")}${(l.negocios || {}).cliente ? " · " + esc(l.negocios.cliente) : ""}<br>Marcado para ${fdt(l.quando)}${l.criado_por && l.criado_por !== eu ? " por " + esc(l.criado_nome) : ""}</div>
      ${atraso > 3600e3 ? `<div class="qt">Atrasado há ${Math.round(atraso / 3600e3) >= 24 ? Math.round(atraso / 86400e3) + " dia(s)" : Math.round(atraso / 3600e3) + " hora(s)"}</div>` : ""}
      <div class="lb-acts"><a class="pri" href="negocios.html?n=${l.negocio_id}">Abrir card</a><button data-a="1h">Adiar 1 hora</button><button data-a="am">Amanhã 8h</button><button class="ok" data-a="ok">Concluído ✓</button></div>
      ${L.length > 1 ? `<div class="lb-mais">+ ${L.length - 1} outro(s) lembrete(s) na fila</div>` : ""}</div>`;
    document.body.appendChild(ov);
    const fim = () => { ov.remove(); mostrando = false; setTimeout(checarLembretes, 400); };
    ov.querySelector('[data-a="ok"]').onclick = async () => { await sb.from("neg_lembretes").update({ feito: true }).eq("id", l.id); fim(); };
    ov.querySelector('[data-a="1h"]').onclick = async () => { const q = new Date(Date.now() + 3600e3); await sb.from("neg_lembretes").update({ quando: q.toISOString() }).eq("id", l.id); fim(); };
    ov.querySelector('[data-a="am"]').onclick = async () => { const q = new Date(); q.setDate(q.getDate() + 1); q.setHours(8, 0, 0, 0); await sb.from("neg_lembretes").update({ quando: q.toISOString() }).eq("id", l.id); fim(); };
    ov.querySelector(".pri").addEventListener("click", () => { adiados.set(l.id, Date.now() + 10 * 60e3); });
  }
  window.ON_LEMBRETES = { checar: checarLembretes };
  setTimeout(checarLembretes, 1500);
  setInterval(checarLembretes, 30000);
})();
