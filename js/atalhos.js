// Barra fixa de atalhos (aparece em todas as telas do sistema)
(function () {
  if (window.__atalhos) return; window.__atalhos = 1;
  // corretor ortográfico em português nos campos de texto
  document.documentElement.lang = document.documentElement.lang || "pt-BR";
  document.addEventListener("focusin", e => { const el = e.target; if (el && (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && (!el.type || el.type === "text") && !/busca|buscar|filtr|código|codigo|cnpj|tel|fone|valor|r\$/i.test((el.placeholder || "") + (el.dataset.f || "") + (el.inputMode || ""))))) { el.spellcheck = true; el.lang = "pt-BR" } }, true);
  // área do cliente (link público da obra): nunca mostra os atalhos internos
  if (new URLSearchParams(location.search).has("t") || /portfolio\.html$/.test(location.pathname)) return;
  const css = `.atl{position:fixed;left:50%;transform:translateX(-50%);bottom:10px;z-index:900;display:flex;gap:4px;align-items:center;background:rgba(30,47,64,.94);border:1px solid #3b5670;border-radius:999px;padding:4px;box-shadow:0 6px 20px rgba(0,0,0,.28);font:600 12px Montserrat,system-ui,sans-serif;backdrop-filter:blur(6px)}
.atl a,.atl button{display:flex;align-items:center;gap:6px;color:#e8f1f9;text-decoration:none;border:0;background:none;border-radius:999px;padding:7px 11px;cursor:pointer;font:inherit;white-space:nowrap}
.atl a:hover,.atl button:hover{background:#2b4157}.atl a.on{background:#62a8dc;color:#0f1c28}
.atl .rot{display:inline}.atl.min .rot{display:none}.atl.min a{padding:7px 9px}
@media (max-width:700px){.atl .rot{display:none}.atl a{padding:7px 9px}}
.atl .grip{cursor:grab;color:#9fb8cc;padding:7px 4px 7px 8px;user-select:none;touch-action:none}.atl .grip:active{cursor:grabbing}
.atl.solto{transform:none}.atl.vert{flex-direction:column;border-radius:22px}.atl.vert .rot{display:none}.atl.vert .grip{padding:6px 7px 2px}
.atl .fundo{font-size:13px}.fpop{position:fixed;z-index:950;background:#1e2f40;color:#e8f1f9;border:1px solid #3b5670;border-radius:12px;padding:12px;box-shadow:0 10px 30px rgba(0,0,0,.35);font:500 13px Montserrat,system-ui,sans-serif;display:grid;gap:8px;width:260px}
.fpop label{display:flex;justify-content:space-between;align-items:center;gap:8px}.fpop button{border:1px solid #3b5670;background:#2b4157;color:#e8f1f9;border-radius:8px;padding:6px 10px;cursor:pointer;font:inherit}.fpop .sw{display:flex;gap:6px;flex-wrap:wrap}.fpop .sw i{width:22px;height:22px;border-radius:6px;cursor:pointer;border:2px solid #fff3}
@media print{.atl{display:none}}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const pg = location.pathname.split("/").pop() || "index.html", hash = location.hash;
  const L = [["🏠", "Início", "index.html#painel", pg === "index.html" && (!hash || hash === "#painel")], ["💼", "Negócios", "negocios.html", pg === "negocios.html"], ["🗂", "Obras", "index.html#kanban", pg === "index.html" && hash === "#kanban" || pg === "obra.html"]];
  const nav = document.createElement("nav"); nav.className = "atl"; nav.setAttribute("aria-label", "Atalhos");
  let min = true; try { min = localStorage.getItem("atl.min") !== "0" } catch (e) {}
  let pos = null; try { pos = JSON.parse(localStorage.getItem("atl.pos") || "null") } catch (e) {}
  const aplicaPos = () => {
    if (!pos) { nav.classList.remove("solto", "vert"); Object.assign(nav.style, { left: "", top: "", bottom: "", right: "" }); return }
    nav.classList.add("solto"); nav.classList.toggle("vert", !!pos.v);
    const w = nav.offsetWidth || 200, h = nav.offsetHeight || 44;
    const x = Math.max(4, Math.min(innerWidth - w - 4, pos.x)), y = Math.max(4, Math.min(innerHeight - h - 4, pos.y));
    Object.assign(nav.style, { left: x + "px", top: y + "px", bottom: "auto", right: "auto" });
  };
  const draw = (extra) => {
    nav.className = "atl" + (min ? " min" : "");
    nav.innerHTML = `<span class="grip" title="Arraste para mover · duplo clique volta ao lugar">⠿</span>` + [...L, ...extra].map(([i, t, h, on]) => `<a href="${h}" class="${on ? "on" : ""}" title="${t}">${i}<span class="rot">${t}</span></a>`).join("") +
      `<button type="button" class="fundo" title="Fundo de tela">🎨</button><button type="button" class="tam" title="${min ? "Mostrar nomes" : "Só ícones"}" aria-label="Alternar tamanho">${min ? "»" : "«"}</button>`;
    nav.querySelector(".tam").onclick = () => { min = !min; try { localStorage.setItem("atl.min", min ? "1" : "0") } catch (e) {} draw(extra) };
    nav.querySelector(".fundo").onclick = e => { e.stopPropagation(); popFundo() };
    const g = nav.querySelector(".grip");
    g.onpointerdown = e => { e.preventDefault(); const r = nav.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top; g.setPointerCapture(e.pointerId);
      g.onpointermove = ev => { const v = ev.clientX < 70 || ev.clientX > innerWidth - 70; pos = { x: ev.clientX - dx, y: ev.clientY - dy, v }; if (v) pos.x = ev.clientX < 70 ? 6 : innerWidth - 60; aplicaPos() };
      g.onpointerup = () => { g.onpointermove = null; try { localStorage.setItem("atl.pos", JSON.stringify(pos)) } catch (e) {} } };
    g.ondblclick = () => { pos = null; try { localStorage.removeItem("atl.pos") } catch (e) {} aplicaPos() };
    requestAnimationFrame(aplicaPos);
  };
  /* fundo de tela por pessoa (cor ou imagem) */
  const FKEY = "on.fundo";
  const idb = () => new Promise((res, rej) => { const r = indexedDB.open("on-fundo", 1); r.onupgradeneeded = () => r.result.createObjectStore("f"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) });
  const idbGet = async k => { try { const d = await idb(); return await new Promise(r => { const q = d.transaction("f").objectStore("f").get(k); q.onsuccess = () => r(q.result); q.onerror = () => r(null) }) } catch (e) { return null } };
  const idbSet = async (k, v) => { try { const d = await idb(); await new Promise(r => { const t = d.transaction("f", "readwrite"); v == null ? t.objectStore("f").delete(k) : t.objectStore("f").put(v, k); t.oncomplete = r; t.onerror = r }) } catch (e) {} };
  let fstyle = null;
  const aplicaFundo = async () => { let f = null; try { f = JSON.parse(localStorage.getItem(FKEY) || "null") } catch (e) {}
    if (!fstyle) { fstyle = document.createElement("style"); document.head.appendChild(fstyle) }
    if (!f) { fstyle.textContent = ""; return }
    if (f.t === "cor") fstyle.textContent = `html,body{background:${f.v}!important}`;
    else if (f.t === "img") { const blob = await idbGet("img"); if (!blob) { fstyle.textContent = ""; return } const u = URL.createObjectURL(blob);
      fstyle.textContent = `html,body{background:linear-gradient(rgba(10,18,28,${f.esc ?? .45}),rgba(10,18,28,${f.esc ?? .45})),url(${u}) center/cover fixed no-repeat!important}` } };
  const popFundo = () => { document.querySelectorAll(".fpop").forEach(x => x.remove()); const p = document.createElement("div"); p.className = "fpop";
    let f = null; try { f = JSON.parse(localStorage.getItem(FKEY) || "null") } catch (e) {}
    p.innerHTML = `<b>Fundo de tela</b><div class="sw">${["#0f1c28", "#1b2a3a", "#23313f", "#e9eef3", "#f6f1e7", "#12261c", "#2a1e33", "#3a2a1a"].map(c => `<i style="background:${c}" data-c="${c}" title="${c}"></i>`).join("")}</div>
      <label>Outra cor <input type="color" id="fCor" value="${f && f.t === "cor" ? f.v : "#1b2a3a"}"></label>
      <label>Imagem <input type="file" id="fImg" accept="image/*" style="width:150px"></label>
      <label>Escurecer imagem <input type="range" id="fEsc" min="0" max="0.8" step="0.05" value="${f && f.esc != null ? f.esc : .45}"></label>
      <div style="display:flex;justify-content:space-between"><button id="fPad">Voltar ao padrão</button><button id="fX">Fechar</button></div>`;
    document.body.appendChild(p); const r = nav.getBoundingClientRect(); p.style.left = Math.max(8, Math.min(innerWidth - 270, r.left)) + "px"; p.style.top = Math.max(8, r.top - p.offsetHeight - 8) + "px";
    const salva = v => { try { v ? localStorage.setItem(FKEY, JSON.stringify(v)) : localStorage.removeItem(FKEY) } catch (e) {} aplicaFundo() };
    p.querySelectorAll("[data-c]").forEach(i => i.onclick = () => salva({ t: "cor", v: i.dataset.c }));
    p.querySelector("#fCor").oninput = e => salva({ t: "cor", v: e.target.value });
    p.querySelector("#fImg").onchange = async e => { const fl = e.target.files[0]; if (!fl) return; await idbSet("img", fl); salva({ t: "img", esc: +p.querySelector("#fEsc").value }) };
    p.querySelector("#fEsc").oninput = e => { let g = null; try { g = JSON.parse(localStorage.getItem(FKEY) || "null") } catch (x) {} if (g && g.t === "img") salva({ ...g, esc: +e.target.value }) };
    p.querySelector("#fPad").onclick = async () => { await idbSet("img", null); salva(null) };
    p.querySelector("#fX").onclick = () => p.remove();
    setTimeout(() => document.addEventListener("pointerdown", function fora(ev) { if (!p.contains(ev.target) && !ev.target.closest(".fundo")) { p.remove(); document.removeEventListener("pointerdown", fora) } }), 0) };
  aplicaFundo();
  addEventListener("resize", () => aplicaPos());
  draw([]);
  const pronto = () => document.body.appendChild(nav);
  if (document.body) pronto(); else document.addEventListener("DOMContentLoaded", pronto);
  (async () => {
    try {
      if (!window.DB || !DB.sb) return; const s = await DB.sessao(); if (!s) { nav.remove(); return }
      const O = DB.sb.schema("orcarede"); const ex = [];
      const [n, c] = await Promise.all([O.rpc("meu_nivel"), O.rpc("pode_compras")]);
      if (n.data) ex.push(["🧮", "OrçaRede", "orcarede.html", pg === "orcarede.html"]);
      if (c.data) ex.push(["🛒", "Compras", "compras.html", pg === "compras.html"]);
      const p = await DB.meuPerfil(); if (p && p.papel === "admin") ex.push(["🗑", "Lixeira", "lixeira.html", pg === "lixeira.html"]);
      draw(ex);
    } catch (e) {}
  })();
})();
