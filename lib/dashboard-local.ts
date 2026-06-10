import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Comunidade, PontoComunidade, ComunidadeUnificada, PagamentosData } from "@/lib/dashboard-data";

/**
 * Lê os JSONs reais convertidos das planilhas (scripts/convert-*.py).
 * Usado em dev/USE_LOCAL_FILES; em produção a BASE vem da Graph API. Os JSONs
 * não vão pro git (dados reais) — rode os scripts em scripts/ pra gerar.
 */
const cache = new Map<string, unknown>();

function readJson<T>(arquivo: string, fallback: T): T {
  if (cache.has(arquivo)) return cache.get(arquivo) as T;
  let data = fallback;
  try {
    data = JSON.parse(readFileSync(join(process.cwd(), "lib", "data", arquivo), "utf8")) as T;
  } catch {
    console.warn(`[dashboard] lib/data/${arquivo} ausente — rode o script em scripts/`);
  }
  cache.set(arquivo, data);
  return data;
}

/** Contratos (aba BASE). */
export const getLocalRows = () => readJson<Comunidade[]>("base.json", []);

/** Pontos geolocalizados das comunidades (planilha de geolocalização). */
export const getLocalGeo = () => readJson<PontoComunidade[]>("geo.json", []);

/** Base unificada (contratadas + repasses por CNPJ), gerada pelo build-master.py. */
export const getLocalUnificada = () => readJson<ComunidadeUnificada[]>("comunidades.json", []);

/** Série mensal de pagamentos (aba PAGAMENTOS), gerada pelo convert-pagamentos.py. */
export const getLocalPagamentos = () =>
  readJson<PagamentosData>("pagamentos.json", {
    meses: [],
    orcamento: { anual: 0, mensal: 0, totalPago: 0, pctExecutado: 0 },
  });
