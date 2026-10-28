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
@media print{.atl{display:none}}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const pg = location.pathname.split("/").pop() || "index.html", hash = location.hash;
  const L = [["🏠", "Início", "index.html#painel", pg === "index.html" && (!hash || hash === "#painel")], ["💼", "Negócios", "negocios.html", pg === "negocios.html"], ["🗂", "Obras", "index.html#kanban", pg === "index.html" && hash === "#kanban" || pg === "obra.html"]];
  const nav = document.createElement("nav"); nav.className = "atl"; nav.setAttribute("aria-label", "Atalhos");
  let min = true; try { min = localStorage.getItem("atl.min") !== "0" } catch (e) {}
  const draw = (extra) => {
    nav.className = "atl" + (min ? " min" : "");
    nav.innerHTML = [...L, ...extra].map(([i, t, h, on]) => `<a href="${h}" class="${on ? "on" : ""}" title="${t}">${i}<span class="rot">${t}</span></a>`).join("") +
      `<button type="button" title="${min ? "Mostrar nomes" : "Só ícones"}" aria-label="Alternar tamanho">${min ? "»" : "«"}</button>`;
    nav.querySelector("button").onclick = () => { min = !min; try { localStorage.setItem("atl.min", min ? "1" : "0") } catch (e) {} draw(extra) };
  };
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
