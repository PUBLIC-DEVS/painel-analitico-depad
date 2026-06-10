#!/usr/bin/env python3
"""Converte a aba PAGAMENTOS (160 colunas, mês a mês de 2025) numa série mensal.
Uso: python convert-pagamentos.py <arquivo.xlsx> <saida.json>

Layout: col 8 = valor contrato anual, col 9 = mensal; a partir da col 10 vêm 12
blocos de 6 colunas por mês (FORMULÁRIO, DATA_ENVIO, VALOR_PAGO, VAGAS_MASC/FEM/MAE).
Agrega tudo em {meses:[...], orcamento:{...}}."""
import openpyxl, sys, json

MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
BASE_MES = 10   # primeira coluna do bloco de Janeiro
LARGURA = 6     # colunas por mês

def to_float(v):
    if v is None: return 0.0
    if isinstance(v, (int, float)): return float(v)
    s = str(v).strip().replace("R$", "").replace(" ", "")
    if not s: return 0.0
    if "," in s: s = s.replace(".", "").replace(",", ".")
    try: return float(s)
    except: return 0.0

def to_int(v): return int(round(to_float(v)))

xlsx, out = sys.argv[1], sys.argv[2]
wb = openpyxl.load_workbook(xlsx, read_only=True, data_only=True)
ws = wb["PAGAMENTOS"]

meses = [{"mes": m, "valorPago": 0.0, "vagasMasc": 0, "vagasFem": 0, "vagasMae": 0} for m in MESES]
anual = mensal = 0.0
primeira = True
for r in ws.iter_rows(values_only=True):
    if primeira:  # cabeçalho
        primeira = False
        continue
    if not r or not (str(r[0]).strip() if r[0] else ""): continue
    anual += to_float(r[8]) if len(r) > 8 else 0
    mensal += to_float(r[9]) if len(r) > 9 else 0
    for m in range(12):
        b = BASE_MES + m * LARGURA
        if b + 5 >= len(r): break
        meses[m]["valorPago"] += to_float(r[b + 2])
        meses[m]["vagasMasc"] += to_int(r[b + 3])
        meses[m]["vagasFem"] += to_int(r[b + 4])
        meses[m]["vagasMae"] += to_int(r[b + 5])
wb.close()

for m in meses:
    m["valorPago"] = round(m["valorPago"], 2)
total_pago = round(sum(m["valorPago"] for m in meses), 2)
dados = {
    "meses": meses,
    "orcamento": {
        "anual": round(anual, 2),
        "mensal": round(mensal, 2),
        "totalPago": total_pago,
        "pctExecutado": round(100 * total_pago / anual, 1) if anual else 0,
    },
}
with open(out, "w", encoding="utf-8") as f:
    json.dump(dados, f, ensure_ascii=False)

print(f"orçamento anual: R$ {anual:,.0f} | total pago 2025: R$ {total_pago:,.0f} | "
      f"executado: {dados['orcamento']['pctExecutado']}%")
print("pago/mês:", [(m["mes"], round(m["valorPago"])) for m in meses])
