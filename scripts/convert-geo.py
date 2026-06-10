#!/usr/bin/env python3
"""Converte a 'Planilha de Geolocalização' em JSON (PontoComunidade[]) pro mapa.
Uso: python convert-geo.py <arquivo.xlsx> <saida.json>
- aba 2025: usa colunas LATITUDE/LONGITUDE (limpas).
- aba 2024: extrai coords da URL do Google Maps em GEOLOCALIZAÇÃO.
Valida que a coordenada cai dentro do Brasil (descarta lixo tipo coords dos EUA)."""
import openpyxl, sys, json, re

# Caixa aproximada do território brasileiro (lat, lng).
LAT_MIN, LAT_MAX = -34.0, 6.0
LNG_MIN, LNG_MAX = -74.0, -34.0

URL_COORD = re.compile(r"(-?\d{1,2}[.,]\d{3,}),\s*(-?\d{1,3}[.,]\d{3,})")

def f(v):
    if v is None: return None
    try: return float(str(v).strip().replace(",", "."))
    except: return None

def txt(v): return "" if v is None else str(v).strip()

def no_brasil(lat, lng):
    return lat is not None and lng is not None and LAT_MIN <= lat <= LAT_MAX and LNG_MIN <= lng <= LNG_MAX

def header_map(rows):
    for r in rows[:5]:
        if r and any(txt(c).upper() == "CNPJ" for c in r):
            return {txt(c).upper(): i for i, c in enumerate(r) if txt(c)}, rows.index(r)
    return {}, 0

xlsx, out = sys.argv[1], sys.argv[2]
wb = openpyxl.load_workbook(xlsx, read_only=True, data_only=True)
pontos, viu, fora = [], 0, 0

for ws in wb.worksheets:
    rows = list(ws.iter_rows(values_only=True))
    hmap, hidx = header_map(rows)
    if "CNPJ" not in hmap: continue
    col = lambda r, *names: next((r[hmap[n]] for n in names if n in hmap and hmap[n] < len(r)), None)
    for r in rows[hidx + 1:]:
        if not r or not txt(col(r, "CNPJ")): continue
        viu += 1
        lat, lng = f(col(r, "LATITUDE")), f(col(r, "LONGITUDE"))
        if lat is None or lng is None:                      # 2024: tenta a URL
            m = URL_COORD.search(txt(col(r, "GEOLOCALIZAÇÃO")))
            if m:
                lat = f(m.group(1)); lng = f(m.group(2))
        if not no_brasil(lat, lng):
            fora += 1; continue
        pontos.append({
            "cnpj": txt(col(r, "CNPJ")),
            "contrato": txt(col(r, "CONTRATO")),
            "entidade": txt(col(r, "ENTIDADE")),
            "uf": txt(col(r, "UF")),
            "cidade": txt(col(r, "LOCALIDADE")),
            "vagas": int(f(col(r, "TOTAL VAGAS CONTRATADAS", "TOTAL VAGAS CONTRATADA")) or 0),
            "lat": lat, "lng": lng,
        })
wb.close()
with open(out, "w", encoding="utf-8") as fp:
    json.dump(pontos, fp, ensure_ascii=False)

print(f"linhas com CNPJ: {viu} | pontos válidos no Brasil: {len(pontos)} | descartados (sem coord/fora): {fora}")
from collections import Counter
print("por UF:", Counter(p["uf"] for p in pontos if p["uf"]).most_common(8))
