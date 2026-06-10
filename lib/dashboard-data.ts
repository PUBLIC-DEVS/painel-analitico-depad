/**
 * Camada de dados do dashboard (server-side).
 *
 * Fonte única em produção: a planilha-mestre `Dashboard/painel_master.xlsx` no
 * SharePoint, lida via Graph API, uma aba por domínio:
 *   • "Contratos"      → contratos crus (Geral, setor Contratos, detalhe)
 *   • "Base Unificada" → comunidades por CNPJ (Base de dados, busca, detalhe)
 *   • "Geo"            → coordenadas (mapa)
 *   • "Pagamentos"     → série mensal 2025 (aba Pagamentos)
 *
 * Em dev (USE_LOCAL_FILES / sem login) cai nos JSONs locais de lib/data (gerados
 * pelos scripts em scripts/). Cada fetch usa unstable_cache (revalida 1h); as
 * agregações são baratas e rodam por cima do resultado já cacheado.
 */

import { unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { config } from "@/config";
import { getLocalRows, getLocalGeo, getLocalUnificada, getLocalPagamentos } from "@/lib/dashboard-local";

/* ───────────────────────────── infra Graph ───────────────────────────── */

// Mesmo site do antigo painel_depad_leve; só muda arquivo e aba.
const masterEndpoint = (aba: string) =>
  `https://graph.microsoft.com/v1.0/sites/` +
  `${config.sharepoint.hostname},52f29331-c2f3-49dd-a449-d2c173ec9eba,5f34bf7f-2136-4760-b81b-72e398af492d` +
  `/drive/root:/Dashboard/painel_master.xlsx:/workbook/worksheets('${encodeURIComponent(aba)}')/usedRange?$select=text`;

/** Lê uma aba da master via Graph e devolve as linhas de dados (sem o cabeçalho). */
async function lerAba(token: string, aba: string): Promise<string[][]> {
  const res = await fetch(masterEndpoint(aba), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Graph API ${res.status} (${aba}): ${(await res.text()).slice(0, 200)}`);
  const json: { text: string[][] } = await res.json();
  return json.text.slice(1);
}

const num = (v?: string) => {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return isNaN(n) ? 0 : n;
};
const sim = (v?: string) => (v ?? "").trim().toLowerCase() === "sim";

function parseBRL(v: string): number {
  const n = parseFloat(v.replace(/\s/g, "").replace("R$", "").replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

/* ─────────────────────────────── Contratos ───────────────────────────── */

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

// Aba "Contratos": uma coluna por campo, na ordem abaixo (sem coluna pulada).
function parseContratoRow(row: string[]): Comunidade | null {
  const contratoAno = row[0]?.trim() ?? "";
  if (!contratoAno) return null;
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
    vagas_contratadas: parseInt(row[12], 10) || 0,
    adulto_masc: parseInt(row[13], 10) || 0,
    adulto_feminino: parseInt(row[14], 10) || 0,
    maes: parseInt(row[15], 10) || 0,
    recurso_anual: row[16]?.trim() ?? "",
    recurso_mensal: row[17]?.trim() ?? "",
    status_ct: row[18]?.trim() ?? "",
    data_inicial_ct: row[19]?.trim() ?? "",
    data_vencimento_ct: row[20]?.trim() ?? "",
    diminuicao_vagas: row[21]?.trim() ?? "",
    sei_assinatura: row[22]?.trim() ?? "",
    assinado: row[23]?.trim() ?? "",
    latitude: row[24]?.trim() ?? "",
    longitude: row[25]?.trim() ?? "",
  };
}

const fetchContratos = unstable_cache(
  async (token: string) => (await lerAba(token, "Contratos")).flatMap((r) => parseContratoRow(r) ?? []),
  ["depad-master-contratos"],
  { revalidate: 3600, tags: ["dashboard-data"] },
);

/** Contratos crus. Graph (master) em produção; JSON local no dev. */
export async function getRows(): Promise<Comunidade[]> {
  if (config.dashboard.useLocalFiles) return getLocalRows();
  const session = await auth();
  const token = session?.user?.accessToken;
  if (token) return fetchContratos(token);
  if (config.dashboard.devPreview) return getLocalRows();
  throw new Error("Sessão ou token não encontrado");
}

/* ─────────────────────────────── agregações ──────────────────────────── */

const filtrarPorUf = (rows: Comunidade[], uf?: string) =>
  uf && uf !== "all" ? rows.filter((r) => r.uf === uf) : rows;

const moedaBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

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
  const m = (await getRows()).reduce((acc: Record<string, number>, r) => {
    if (r.uf) acc[r.uf] = (acc[r.uf] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(m)
    .map(([uf, total]) => ({ uf, total }))
    .sort((a, b) => b.total - a.total);
}

export async function getPorEdital(uf?: string) {
  const m = filtrarPorUf(await getRows(), uf).reduce((acc: Record<string, number>, r) => {
    if (r.ano) acc[r.ano] = (acc[r.ano] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(m)
    .map(([edital, total]) => ({ edital, total }))
    .sort((a, b) => Number(a.edital) - Number(b.edital));
}

export async function getRecursoPorEdital(uf?: string) {
  const m = filtrarPorUf(await getRows(), uf).reduce((acc: Record<string, number>, r) => {
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

/* ─────────────────────────────────── Geo ─────────────────────────────── */

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

// Aba "Geo": CNPJ, Entidade, Contrato, UF, Cidade, Vagas, Latitude, Longitude.
function parseGeoRow(row: string[]): PontoComunidade | null {
  const cnpj = row[0]?.trim() ?? "";
  const lat = num(row[6]), lng = num(row[7]);
  if (!cnpj || cnpj.toUpperCase() === "CNPJ" || !lat || !lng) return null;
  return {
    cnpj,
    entidade: row[1]?.trim() ?? "",
    contrato: row[2]?.trim() ?? "",
    uf: row[3]?.trim() ?? "",
    cidade: row[4]?.trim() ?? "",
    vagas: parseInt(row[5], 10) || 0,
    lat,
    lng,
  };
}

const fetchGeo = unstable_cache(
  async (token: string) => (await lerAba(token, "Geo")).flatMap((r) => parseGeoRow(r) ?? []),
  ["depad-master-geo"],
  { revalidate: 3600, tags: ["dashboard-data"] },
);

async function getGeo(): Promise<PontoComunidade[]> {
  if (config.dashboard.useLocalFiles) return getLocalGeo();
  const session = await auth();
  const token = session?.user?.accessToken;
  if (token) return fetchGeo(token);
  return getLocalGeo();
}

export async function getPontosMapa(uf?: string): Promise<PontoComunidade[]> {
  const pontos = await getGeo();
  return uf && uf !== "all" ? pontos.filter((p) => p.uf === uf) : pontos;
}

/* ──────────────────────────────── Pagamentos ─────────────────────────── */

export interface PagamentosData {
  meses: { mes: string; valorPago: number; vagasMasc: number; vagasFem: number; vagasMae: number }[];
  orcamento: { anual: number; mensal: number; totalPago: number; pctExecutado: number };
}

// Aba "Pagamentos": Mês, Valor Pago, Vagas Masc/Fem/Mãe + Orçamento Anual/Mensal
// (estes dois só preenchidos na 1ª linha).
function parsePagamentos(rows: string[][]): PagamentosData {
  const dados = rows.filter((r) => r[0]?.trim()).slice(0, 12);
  const meses = dados.map((r) => ({
    mes: r[0].trim(),
    valorPago: num(r[1]),
    vagasMasc: parseInt(r[2], 10) || 0,
    vagasFem: parseInt(r[3], 10) || 0,
    vagasMae: parseInt(r[4], 10) || 0,
  }));
  const anual = num(dados[0]?.[5]);
  const mensal = num(dados[0]?.[6]);
  const totalPago = meses.reduce((s, m) => s + m.valorPago, 0);
  return {
    meses,
    orcamento: { anual, mensal, totalPago, pctExecutado: anual ? Math.round((1000 * totalPago) / anual) / 10 : 0 },
  };
}

const fetchPagamentos = unstable_cache(
  async (token: string) => parsePagamentos(await lerAba(token, "Pagamentos")),
  ["depad-master-pagamentos"],
  { revalidate: 3600, tags: ["dashboard-data"] },
);

export async function getPagamentos(): Promise<PagamentosData> {
  if (config.dashboard.useLocalFiles) return getLocalPagamentos();
  const session = await auth();
  const token = session?.user?.accessToken;
  if (token) return fetchPagamentos(token);
  return getLocalPagamentos();
}

/* ───────────────────────────── Base unificada ────────────────────────── */

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

// Aba "Base Unificada": CNPJ, Nome, UF, Cidade, Tipo, Tem Contrato, Tem Repasse,
// Vagas, Masc, Fem, Mães, Recurso, Repasse, Qtd Emendas, Status, Ano, Parl., Modal.
function parseUnificadaRow(row: string[]): ComunidadeUnificada | null {
  const cnpj = row[0]?.trim() ?? "";
  if (!cnpj || cnpj.toUpperCase() === "CNPJ") return null;
  const t = row[4]?.trim();
  return {
    cnpj,
    nome: row[1]?.trim() ?? "",
    uf: row[2]?.trim() ?? "",
    cidade: row[3]?.trim() ?? "",
    tipo: t === "Repasse" || t === "Ambos" ? t : "Contratada",
    tem_contrato: sim(row[5]),
    tem_repasse: sim(row[6]),
    vagas_contratadas: parseInt(row[7], 10) || 0,
    adulto_masc: parseInt(row[8], 10) || 0,
    adulto_feminino: parseInt(row[9], 10) || 0,
    maes: parseInt(row[10], 10) || 0,
    recurso_anual_contrato: parseBRL(row[11] ?? ""),
    valor_repasse_total: parseBRL(row[12] ?? ""),
    qtd_emendas: parseInt(row[13], 10) || 0,
    status_ct: row[14]?.trim() ?? "",
    ano_contrato: row[15]?.trim() ?? "",
    parlamentares: row[16]?.trim() ?? "",
    modalidades: row[17]?.trim() ?? "",
  };
}

const fetchUnificada = unstable_cache(
  async (token: string) => (await lerAba(token, "Base Unificada")).flatMap((r) => parseUnificadaRow(r) ?? []),
  ["depad-master-unificada"],
  { revalidate: 3600, tags: ["dashboard-data"] },
);

/** Base unificada — Graph (master) em produção; JSON local no dev. Degrada pra
 *  local em vez de quebrar (a busca/base nunca devem dar 500). */
export async function getComunidadesUnificadas(): Promise<ComunidadeUnificada[]> {
  if (config.dashboard.useLocalFiles) return getLocalUnificada();
  const session = await auth();
  const token = session?.user?.accessToken;
  if (token) return fetchUnificada(token);
  return getLocalUnificada();
}

/* ──────────────────────── detalhe de uma comunidade ──────────────────── */

const soDigitos = (s: string) => s.replace(/\D/g, "");

export interface DetalheComunidade {
  unificada: ComunidadeUnificada;
  contratos: Comunidade[]; // todos os contratos crus dessa CT (pode ter vários anos)
  ponto: PontoComunidade | null; // geolocalização, se houver
}

/** Junta tudo que se sabe de uma comunidade pelo CNPJ (só dígitos). */
export async function getComunidadePorCnpj(cnpj: string): Promise<DetalheComunidade | null> {
  const chave = soDigitos(cnpj);
  const unificada = (await getComunidadesUnificadas()).find((c) => soDigitos(c.cnpj) === chave);
  if (!unificada) return null;

  // contratos crus e geolocalização são opcionais — não derrubam a página.
  let contratos: Comunidade[] = [];
  try {
    contratos = (await getRows()).filter((r) => soDigitos(r.cnpj) === chave);
  } catch {
    /* sem contratos detalhados */
  }
  const ponto = (await getGeo()).find((p) => soDigitos(p.cnpj) === chave) ?? null;
  return { unificada, contratos, ponto };
}
