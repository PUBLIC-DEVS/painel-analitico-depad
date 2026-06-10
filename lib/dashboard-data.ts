/**
 * Camada de dados do dashboard (server-side).
 *
 * Centraliza o acesso à planilha (Graph API) e as agregações. É chamada direto
 * pelos Server Components do dashboard (sem passar por HTTP) e também pela rota
 * /api/dashboard/geral (que o mapa e a tabela consomem no cliente).
 *
 * Cache: o fetch da planilha usa unstable_cache (revalida a cada 1h). As
 * agregações são baratas e rodam por cima do resultado já cacheado.
 */

import { unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { config } from "@/config";
import { getLocalRows, getLocalGeo, getLocalUnificada, getLocalPagamentos } from "@/lib/dashboard-local";

export interface Comunidade {
  contrato_ano: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  processo_mae: string;
  cidade: string;
  uf: string;
  contrato: string;
  ano: number;
  endereco: string;
  telefone: string;
  email: string;
  vagas_contratadas: number | null;
  adulto_masc: number | null;
  adulto_feminino: number | null;
  maes: number | null;
  recurso_anual: string;
  recurso_mensal: string;
  status_ct: string;
  data_inicial_ct: string;
  data_vencimento_ct: string;
  diminuicao_vagas: string;
  sei_assinatura: string;
  assinado: string;
  latitude: string;
  longitude: string;
}

// Planilha no SharePoint via Graph. O ID composto do site já vem resolvido.
const WORKSHEET = encodeURIComponent("BASE");
const GRAPH_ENDPOINT =
  `https://graph.microsoft.com/v1.0/sites/` +
  `${config.sharepoint.hostname},52f29331-c2f3-49dd-a449-d2c173ec9eba,5f34bf7f-2136-4760-b81b-72e398af492d` +
  `/drive/root:/Dashboard/painel_depad_leve.xlsx:/workbook/worksheets('${WORKSHEET}')/usedRange?$select=text`;

function parseBRL(v: string): number {
  const n = parseFloat(v.replace(/\s/g, "").replace("R$", "").replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function parseRow(row: string[]): Comunidade | null {
  const contratoAno = row[0]?.trim() ?? "";
  if (!contratoAno || contratoAno === "CONTRATO/ANO") return null;
  return {
    contrato_ano: contratoAno,
    razao_social: row[1]?.trim() ?? "",
    nome_fantasia: row[2]?.trim() ?? "",
    cnpj: row[3]?.trim() ?? "",
    processo_mae: row[4]?.trim() ?? "",
    cidade: row[5]?.trim() ?? "",
    uf: row[6]?.trim() ?? "",
    contrato: row[7]?.trim() ?? "",
    ano: parseInt(row[8] ?? "", 10) || 0,
    endereco: row[9]?.trim() ?? "",
    telefone: row[10]?.trim() ?? "",
    email: row[11]?.trim() ?? "",
    vagas_contratadas: parseInt(row[13], 10) || 0,
    adulto_masc: parseInt(row[14], 10) || 0,
    adulto_feminino: parseInt(row[15], 10) || 0,
    maes: parseInt(row[16], 10) || 0,
    recurso_anual: row[17]?.trim() ?? "",
    recurso_mensal: row[18]?.trim() ?? "",
    status_ct: row[19]?.trim() ?? "",
    data_inicial_ct: row[20]?.trim() ?? "",
    data_vencimento_ct: row[21]?.trim() ?? "",
    diminuicao_vagas: row[22]?.trim() ?? "",
    sei_assinatura: row[23]?.trim() ?? "",
    assinado: row[24]?.trim() ?? "",
    latitude: row[25]?.trim() ?? "",
    longitude: row[26]?.trim() ?? "",
  };
}

const fetchSheetRows = unstable_cache(
  async (token: string): Promise<Comunidade[]> => {
    const res = await fetch(GRAPH_ENDPOINT, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Graph API ${res.status}: ${text.slice(0, 300)}`);
    }
    const json: { text: string[][] } = await res.json();
    return json.text.slice(1).flatMap((row) => {
      const c = parseRow(row);
      return c ? [c] : [];
    });
  },
  ["depad-base-geral"],
  { revalidate: 3600, tags: ["dashboard-data"] },
);

/** Linhas da planilha. Local (JSON real) em dev; Graph API em produção. */
export async function getRows(): Promise<Comunidade[]> {
  if (config.dashboard.useLocalFiles) return getLocalRows();

  const session = await auth();
  const token = session?.user?.accessToken;
  if (token) return fetchSheetRows(token);
  if (config.dashboard.devPreview) return getLocalRows();
  throw new Error("Sessão ou token não encontrado");
}

const filtrarPorUf = (rows: Comunidade[], uf?: string) =>
  uf && uf !== "all" ? rows.filter((r) => r.uf === uf) : rows;

const moedaBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// ─── Agregações ──────────────────────────────────────────────────────────────

export async function getStats(uf?: string) {
  const rows = filtrarPorUf(await getRows(), uf);
  let vagas = 0, masc = 0, fem = 0, maes = 0, orcamento = 0;
  for (const r of rows) {
    vagas += r.vagas_contratadas ?? 0;
    masc += r.adulto_masc ?? 0;
    fem += r.adulto_feminino ?? 0;
    maes += r.maes ?? 0;
    orcamento += parseBRL(r.recurso_anual);
  }
  return {
    comunidadesTerapeuticas: rows.length,
    totalVagas: vagas,
    vagasMasculinas: masc,
    vagasFemininas: fem,
    vagasParaMaes: maes,
    orcamentoAnual: moedaBRL.format(orcamento),
  };
}

/** Contagem por UF — sempre sobre todas as linhas (o mapa mostra o país inteiro). */
export async function getPorUf() {
  const rows = await getRows();
  const m = rows.reduce((acc: Record<string, number>, r) => {
    if (r.uf) acc[r.uf] = (acc[r.uf] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(m)
    .map(([uf, total]) => ({ uf, total }))
    .sort((a, b) => b.total - a.total);
}

export async function getPorEdital(uf?: string) {
  const rows = filtrarPorUf(await getRows(), uf);
  const m = rows.reduce((acc: Record<string, number>, r) => {
    if (r.ano) acc[r.ano] = (acc[r.ano] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(m)
    .map(([edital, total]) => ({ edital, total }))
    .sort((a, b) => Number(a.edital) - Number(b.edital));
}

export async function getRecursoPorEdital(uf?: string) {
  const rows = filtrarPorUf(await getRows(), uf);
  const m = rows.reduce((acc: Record<string, number>, r) => {
    if (r.ano) acc[r.ano] = (acc[r.ano] ?? 0) + parseBRL(r.recurso_anual);
    return acc;
  }, {});
  return Object.entries(m)
    .map(([edital, total]) => ({ edital, total }))
    .sort((a, b) => Number(a.edital) - Number(b.edital));
}

export async function getComunidades(uf?: string) {
  return filtrarPorUf(await getRows(), uf);
}

/** Comunidade com coordenadas, pro mapa (planilha de geolocalização). */
export interface PontoComunidade {
  cnpj: string;
  contrato: string;
  entidade: string;
  uf: string;
  cidade: string;
  vagas: number;
  lat: number;
  lng: number;
}

/**
 * Pontos geolocalizados pro mapa das comunidades. Hoje vêm do JSON local
 * (dado de referência mantido à parte). TODO: quando a aba de geolocalização
 * entrar na planilha-mestre, puxar via Graph igual ao resto.
 */
export function getPontosMapa(uf?: string): PontoComunidade[] {
  const pontos = getLocalGeo();
  return uf && uf !== "all" ? pontos.filter((p) => p.uf === uf) : pontos;
}

/** Comunidade na base unificada (contratadas + repasses deduplicados por CNPJ). */
export interface ComunidadeUnificada {
  cnpj: string;
  nome: string;
  uf: string;
  cidade: string;
  tipo: "Contratada" | "Repasse" | "Ambos";
  tem_contrato: boolean;
  tem_repasse: boolean;
  vagas_contratadas: number;
  adulto_masc: number;
  adulto_feminino: number;
  maes: number;
  recurso_anual_contrato: number;
  valor_repasse_total: number;
  qtd_emendas: number;
  status_ct: string;
  ano_contrato: string;
  parlamentares: string;
  modalidades: string;
}

/** Base unificada — gerada por scripts/build-master.py (a "planilha master"). */
export function getComunidadesUnificadas(): ComunidadeUnificada[] {
  return getLocalUnificada();
}

/** Série mensal de pagamentos 2025 + orçamento (aba PAGAMENTOS). */
export interface PagamentosData {
  meses: { mes: string; valorPago: number; vagasMasc: number; vagasFem: number; vagasMae: number }[];
  orcamento: { anual: number; mensal: number; totalPago: number; pctExecutado: number };
}

export function getPagamentos(): PagamentosData {
  return getLocalPagamentos();
}

/* ── detalhe de uma comunidade (página individual) ── */

const soDigitos = (s: string) => s.replace(/\D/g, "");

export interface DetalheComunidade {
  unificada: ComunidadeUnificada;
  contratos: Comunidade[]; // todos os contratos crus dessa CT (pode ter vários anos)
  ponto: PontoComunidade | null; // geolocalização, se houver
}

/** Junta tudo que se sabe de uma comunidade pelo CNPJ (só dígitos). */
export function getComunidadePorCnpj(cnpj: string): DetalheComunidade | null {
  const chave = soDigitos(cnpj);
  const unificada = getLocalUnificada().find((c) => soDigitos(c.cnpj) === chave);
  if (!unificada) return null;
  return {
    unificada,
    contratos: getLocalRows().filter((r) => soDigitos(r.cnpj) === chave),
    ponto: getLocalGeo().find((p) => soDigitos(p.cnpj) === chave) ?? null,
  };
}
