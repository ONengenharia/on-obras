#!/usr/bin/env python3
"""Coletor de editais do OrçaRede.

Busca no PNCP os editais com propostas abertas, filtra pelas condições gravadas no
banco (tabela orcarede.licitacao_condicoes) e grava o resultado em
orcarede.licitacao_editais. Roda todo dia pelo GitHub Actions
(.github/workflows/licitacoes.yml).

Variáveis de ambiente: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
Teste sem gravar nada:  python3 licitacoes/coletor.py --seco
"""
import argparse
import json
import os
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone

PNCP = "https://pncp.gov.br/api/consulta/v1/contratacoes/proposta"
MODALIDADES = {4: "Concorrência eletrônica", 5: "Concorrência presencial", 6: "Pregão eletrônico", 8: "Dispensa"}
MAX_PAGINAS = 30
SOLAR = ("fotovoltaic", "solar", "microgeracao", "minigeracao", "geracao distribuida")
PADRAO = {
    "uf": "RS", "dias_busca": 60, "modalidades": [4, 5, 6],
    "palavras": ["fotovoltaic", "usina solar", "energia solar", "instalações elétricas", "subestação",
                 "iluminação pública", "rede de distribuição", "manutenção elétrica", "SPDA"],
    "excluir": [], "valor_min": None, "valor_max": None, "dias_minimos": 7,
}


def norm(texto):
    texto = unicodedata.normalize("NFD", texto or "")
    return "".join(c for c in texto if unicodedata.category(c) != "Mn").lower()


def pedir(url, headers=None, corpo=None, metodo=None, tentativas=6):
    """Consulta com espera e nova tentativa quando o servidor pede calma (429) ou falha."""
    espera = 3
    for t in range(1, tentativas + 1):
        req = urllib.request.Request(url, data=corpo, method=metodo,
                                     headers={"Accept": "application/json", "User-Agent": "orcarede-coletor/1.0", **(headers or {})})
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                dados = resp.read()
                if resp.status == 204 or not dados:
                    return None
                return json.loads(dados)
        except urllib.error.HTTPError as e:
            if e.code == 204:
                return None
            if e.code in (429, 500, 502, 503, 504) and t < tentativas:
                ra = e.headers.get("Retry-After")
                pausa = int(ra) if ra and ra.isdigit() else espera
                print(f"  Servidor pediu para aguardar (erro {e.code}). Nova tentativa em {pausa}s ({t}/{tentativas - 1})...")
                time.sleep(pausa)
                espera = min(espera * 2, 60)
                continue
            raise
        except (urllib.error.URLError, TimeoutError):
            if t < tentativas:
                time.sleep(espera)
                espera = min(espera * 2, 60)
                continue
            raise
    return None


class Banco:
    """Acesso mínimo ao PostgREST do Supabase (schema orcarede) com a chave de serviço."""

    def __init__(self):
        self.url = os.environ["SUPABASE_URL"].rstrip("/") + "/rest/v1/"
        chave = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        self.h = {"apikey": chave, "Authorization": "Bearer " + chave}

    def condicoes(self):
        r = pedir(self.url + "licitacao_condicoes?id=eq.1&select=dados", {**self.h, "Accept-Profile": "orcarede"})
        return (r[0]["dados"] if r else None) or {}

    def gravar(self, linhas):
        for i in range(0, len(linhas), 100):
            lote = json.dumps(linhas[i:i + 100]).encode()
            pedir(self.url + "licitacao_editais?on_conflict=pncp_id",
                  {**self.h, "Content-Profile": "orcarede", "Content-Type": "application/json",
                   "Prefer": "resolution=merge-duplicates,return=minimal"}, lote, "POST")


def buscar(cod, uf, data_final, pausa):
    itens = []
    for pagina in range(1, MAX_PAGINAS + 1):
        url = (f"{PNCP}?dataFinal={data_final}&codigoModalidadeContratacao={cod}"
               f"&uf={urllib.parse.quote(uf)}&pagina={pagina}&tamanhoPagina=50")
        try:
            corpo = pedir(url)
        except Exception as e:
            print(f"  Aviso: parei {MODALIDADES.get(cod, cod)} na página {pagina} ({e}). Sigo com o que já foi coletado.")
            break
        if not corpo:
            break
        dados = corpo.get("data") or []
        itens.extend(dados)
        total = corpo.get("totalPaginas") or 0
        print(f"  {MODALIDADES.get(cod, cod)}: página {pagina} de {total or '?'}")
        if not dados or corpo.get("paginasRestantes") == 0 or (total and pagina >= total):
            break
        time.sleep(pausa)
    return itens


def data_iso(s):
    """O PNCP informa horário de Brasília sem fuso: acrescenta -03:00."""
    if not s:
        return None
    return s if (len(s) > 19 and (s[-6] in "+-" or s.endswith("Z"))) else s + "-03:00"


def linha(it, achadas):
    org, un = it.get("orgaoEntidade") or {}, it.get("unidadeOrgao") or {}
    cnpj = "".join(c for c in str(org.get("cnpj", "")) if c.isdigit())
    ano, seq = it.get("anoCompra"), it.get("sequencialCompra")
    texto = norm(it.get("objetoCompra"))
    return {
        "pncp_id": it.get("numeroControlePNCP") or f"{cnpj}-{ano}-{seq}",
        "cnpj_orgao": cnpj, "ano": ano, "sequencial": seq,
        "orgao": org.get("razaoSocial"), "municipio": un.get("municipioNome"), "uf": un.get("ufSigla"),
        "objeto": " ".join((it.get("objetoCompra") or "").split()) or "(sem descrição)",
        "modalidade": it.get("modalidadeNome"), "modalidade_id": it.get("modalidadeId"),
        "valor_estimado": it.get("valorTotalEstimado"),
        "abertura_propostas": data_iso(it.get("dataAberturaProposta")),
        "encerramento_propostas": data_iso(it.get("dataEncerramentoProposta")),
        "situacao_pncp": it.get("situacaoCompraNome"),
        "link_pncp": f"https://pncp.gov.br/app/editais/{cnpj}/{ano}/{seq}",
        "link_origem": it.get("linkSistemaOrigem"),
        "palavras": achadas,
        "unidade": "solar" if any(k in texto for k in SOLAR) else "eletrica",
        "atualizado_em": datetime.now(timezone.utc).isoformat(),
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--seco", action="store_true", help="não grava no banco; usa as condições padrão")
    ap.add_argument("--pausa", type=float, default=1.0, help="segundos entre consultas ao PNCP")
    a = ap.parse_args()

    banco = None if a.seco else Banco()
    cond = {**PADRAO, **(banco.condicoes() if banco else {})}
    palavras = [p for p in cond["palavras"] if p]
    excluir = [norm(x) for x in cond["excluir"] if x]
    data_final = (date.today() + timedelta(days=int(cond["dias_busca"]))).strftime("%Y%m%d")
    print(f"Condições: UF {cond['uf']}, propostas até {data_final}, modalidades {cond['modalidades']}, {len(palavras)} palavras-chave")

    vistos = {}
    for cod in cond["modalidades"]:
        print(f"Consultando {MODALIDADES.get(int(cod), cod)}...")
        for it in buscar(int(cod), cond["uf"], data_final, a.pausa):
            vistos[it.get("numeroControlePNCP") or json.dumps(it, sort_keys=True)[:80]] = it

    linhas = []
    for it in vistos.values():
        texto = norm(it.get("objetoCompra")) + " " + norm(it.get("informacaoComplementar"))
        if any(x in texto for x in excluir):
            continue
        valor = it.get("valorTotalEstimado")
        if valor is not None:
            if cond["valor_min"] is not None and valor < float(cond["valor_min"]):
                continue
            if cond["valor_max"] is not None and valor > float(cond["valor_max"]):
                continue
        achadas = [p for p in palavras if norm(p) in texto]
        if achadas:
            linhas.append(linha(it, achadas))

    print(f"{len(vistos)} editais abertos analisados, {len(linhas)} compatíveis.")
    if a.seco:
        for l in linhas[:10]:
            print(f"  - {l['municipio']}/{l['uf']} | {l['modalidade']} | {l['objeto'][:90]}")
        return
    if linhas:
        banco.gravar(linhas)
        print("Gravado no banco.")


if __name__ == "__main__":
    main()
