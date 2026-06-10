#!/usr/bin/env python3
"""Converte a aba BASE da planilha de contratos para JSON (Comunidade[]).
Uso: python convert-base.py <arquivo.xlsx> <saida.json> [aba=BASE]
Lê por posição de coluna (a planilha pula a coluna 12). Requer openpyxl."""
import openpyxl, sys, json
from collections import Counter

def to_float(v):
    if v is None: return 0.0
    if isinstance(v, (int, float)): return float(v)
    s = str(v).strip().replace("R$", "").replace(" ", "")
    if not s: return 0.0
    if "," in s:                      # formato pt-BR: 1.234,56
        s = s.replace(".", "").replace(",", ".")
    try: return float(s)
    except: return 0.0

def to_int(v): return int(round(to_float(v)))

def to_brl(v):
    s = f"{to_float(v):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return "R$ " + s

def txt(v):
    s = "" if v is None else str(v).strip()
    return "" if s.upper() in ("N/A", "NA", "-") else s

xlsx, out = sys.argv[1], sys.argv[2]
sheet = sys.argv[3] if len(sys.argv) > 3 else "BASE"
wb = openpyxl.load_workbook(xlsx, read_only=True, data_only=True)
ws = wb[sheet]

rows = []
for r in ws.iter_rows(values_only=True):
    c0 = txt(r[0]) if len(r) else ""
    if not c0 or c0 == "CONTRATO/ANO": continue
    g = lambda i: r[i] if i < len(r) else None
    rows.append({
        "contrato_ano": c0, "razao_social": txt(g(1)), "nome_fantasia": txt(g(2)),
        "cnpj": txt(g(3)), "processo_mae": txt(g(4)), "cidade": txt(g(5)), "uf": txt(g(6)),
        "contrato": txt(g(7)), "ano": to_int(g(8)), "endereco": txt(g(9)),
        "telefone": txt(g(10)), "email": txt(g(11)),
        "vagas_contratadas": to_int(g(13)), "adulto_masc": to_int(g(14)),
        "adulto_feminino": to_int(g(15)), "maes": to_int(g(16)),
        "recurso_anual": to_brl(g(17)) if txt(g(17)) else "",
        "recurso_mensal": to_brl(g(18)) if txt(g(18)) else "",
        "status_ct": txt(g(19)), "data_inicial_ct": txt(g(20)), "data_vencimento_ct": txt(g(21)),
        "diminuicao_vagas": txt(g(22)), "sei_assinatura": txt(g(23)), "assinado": txt(g(24)),
        "latitude": txt(g(25)), "longitude": txt(g(26)),
    })
wb.close()
with open(out, "w", encoding="utf-8") as f:
    json.dump(rows, f, ensure_ascii=False)

n = len(rows) or 1
print(f"linhas: {len(rows)} | com UF: {sum(1 for x in rows if x['uf'])} | "
      f"com vagas: {sum(1 for x in rows if x['vagas_contratadas'] > 0)} | "
      f"com recurso: {sum(1 for x in rows if x['recurso_anual'])}")
print(f"soma vagas: {sum(x['vagas_contratadas'] for x in rows)}")
print("UFs:", Counter(x['uf'] for x in rows if x['uf']).most_common(8))
