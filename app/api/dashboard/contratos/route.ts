import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { auth } from "@/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

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

export interface MapPoint {
  id: string;
  nome: string;
  nome_fantasia: string;
  cnpj: string;
  cidade: string;
  uf: string;
  lat: number;
  lng: number;
  vagas_contratadas: number;
  adulto_masc: number;
  adulto_feminino: number;
  maes: number;
  status_ct: string;
  recurso_mensal: string;
}

export interface MonthEntry {
  mes: string;
  pago: number;
  previsto: number;
}

export interface OrcamentoEntry {
  anual: number;
  mensal: number;
  mediaUso: number;
  avgPct: number;
  mensal_pct: number;
  anual_pct: number;
}

export interface PagamentosData {
  monthly: Record<string, MonthEntry[]>;
  orcamento: Record<string, OrcamentoEntry>;
}

// ─── Graph API Endpoints ──────────────────────────────────────────────────────

const SITE =
  `mdsgov.sharepoint.com,` +
  `52f29331-c2f3-49dd-a449-d2c173ec9eba,` +
  `5f34bf7f-2136-4760-b81b-72e398af492d`;

const BASE_URL =
  `https://graph.microsoft.com/v1.0/sites/${SITE}` +
  `/drive/root:/Dashboard/painel_depad_leve.xlsx:/workbook/worksheets`;

const GERAL_ENDPOINT = `${BASE_URL}('${encodeURIComponent("BASE")}')/usedRange?$select=text`;

const PAGAMENTOS_ENDPOINT = `${BASE_URL}('${encodeURIComponent("PAGAMENTOS")}')/usedRange?$select=values`;

export const REGIOES: Record<string, string[]> = {
  norte:        ["AC", "AM", "AP", "PA", "RO", "RR", "TO"],
  nordeste:     ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
  "centro-oeste": ["DF", "GO", "MS", "MT"],
  sudeste:      ["ES", "MG", "RJ", "SP"],
  sul:          ["PR", "RS", "SC"],
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS_PT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

// Mapeamento de colunas da sheet PAGAMENTOS (verificado no xlsx)
// 2025: valor_anual=8,  valor_mensal=9,  first_pago=12 (step 6 por mês)
// 2026: valor_anual=84, valor_mensal=85, first_pago=88 (step 6 por mês)
const YEAR_COLS: Record<
  string,
  { valorAnual: number; valorMensal: number; firstPago: number }
> = {
  "2025": { valorAnual: 8, valorMensal: 9, firstPago: 12 },
  "2026": { valorAnual: 84, valorMensal: 85, firstPago: 88 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Valores BRL formatados como "R$ 1.234,56" (sheet geral)
function parseBRL(v: string): number {
  const n = parseFloat(
    v.replace(/\s/g, "").replace("R$", "").replace(/\./g, "").replace(",", "."),
  );
  return isNaN(n) ? 0 : n;
}

// Valores numéricos brutos como "104787.92" ou "N/A" (sheet pagamentos)
function parseNum(v: string): number {
  if (!v || v === "N/A" || v === "false" || v.startsWith("=")) return 0;

  // values retorna "104787.92" — sem vírgula = já é formato internacional
  if (!v.includes(",")) {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  // Formato BRL da sheet: "104.787,92" → strip de milhar, vírgula → ponto
  const n = parseFloat(v.replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function parseGeralRow(row: string[]): Comunidade | null {
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

// ─── Fetchers com cache ───────────────────────────────────────────────────────

const fetchGeralRows = unstable_cache(
  async (token: string): Promise<Comunidade[]> => {
    const res = await fetch(GERAL_ENDPOINT, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Graph API (geral) ${res.status}: ${text.slice(0, 300)}`);
    }
    const json: { text: string[][] } = await res.json();
    return json.text.slice(1).flatMap((row) => {
      const c = parseGeralRow(row);
      return c ? [c] : [];
    });
  },
  ["depad-base-vigente-2024"],
  { revalidate: 3600, tags: ["dashboard-data"] },
);

const fetchPagamentosRows = unstable_cache(
  async (token: string): Promise<string[][]> => {
    const res = await fetch(PAGAMENTOS_ENDPOINT, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Erro Graph:", text);
      throw new Error(`Graph API ${res.status}`);
    }
    const json = await res.json();

    // $select=values retorna json.values (não json.text)
    const data: unknown[][] = json.values;

    if (!data || !Array.isArray(data)) return [];

    // Normaliza tudo para string — values pode trazer numbers diretamente
    return data
      .slice(1)
      .filter((row) => row.some((cell) => cell !== "" && cell !== null))
      .map((row) => row.map((cell) => (cell == null ? "" : String(cell))));
  },
  ["depad-pagamentos-v3"], // chave nova força invalidação do cache anterior
  { revalidate: 3600, tags: ["dashboard-data"] },
);
// ─── Aggregations — Geral ─────────────────────────────────────────────────────

function buildStats(rows: Comunidade[]) {
  let totalVagas = 0,
    vagasMasc = 0,
    vagasFem = 0,
    vagasMaes = 0,
    orcamento = 0;

  for (const r of rows) {
    totalVagas += r.vagas_contratadas ?? 0;
    vagasMasc += r.adulto_masc ?? 0;
    vagasFem += r.adulto_feminino ?? 0;
    vagasMaes += r.maes ?? 0;
    orcamento += parseBRL(r.recurso_anual);
  }

  return {
    totalVagas,
    vagasMasculinas: vagasMasc,
    vagasFemininas: vagasFem,
    vagasParaMaes: vagasMaes,
    orcamentoAnual: new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(orcamento),
    contratosRegistrados: rows.length,
    comunidadesTerapeuticas: rows.length,
  };
}

// ─── Aggregations — Pagamentos ────────────────────────────────────────────────

function buildPagamentos(rows: string[][]): PagamentosData {
  const monthly: Record<string, MonthEntry[]> = {};
  const orcamento: Record<string, OrcamentoEntry> = {};

  for (const year of Object.keys(YEAR_COLS)) {
    const { valorAnual, valorMensal, firstPago } = YEAR_COLS[year];

    const monthSums = MONTHS_PT.map((mes) => ({ mes, pago: 0, previsto: 0 }));
    let totalAnual = 0;
    let totalMensal = 0;

    for (const row of rows) {
      const va = parseNum(row[valorAnual] ?? "");
      const vm = parseNum(row[valorMensal] ?? "");
      totalAnual += va;
      totalMensal += vm;

      for (let m = 0; m < 12; m++) {
        const pagoCol = firstPago + m * 6;
        // O operador ?. e o fallback evitam quebras se a linha for curta
        const val = row && row[pagoCol] ? row[pagoCol] : "0";
        monthSums[m].pago += parseNum(val);
        monthSums[m].previsto += vm;
      }
    }

    monthly[year] = monthSums;

    const paidMonths = monthSums.filter((m) => m.pago > 0);
    const totalPago = monthSums.reduce((acc, m) => acc + m.pago, 0);
    const totalPrev = monthSums.reduce((acc, m) => acc + m.previsto, 0);
    const mediaUso = paidMonths.length > 0 ? totalPago / paidMonths.length : 0;
    const avgPct = totalPrev > 0 ? (totalPago / totalPrev) * 100 : 0;

    orcamento[year] = {
      anual: totalAnual,
      mensal: totalMensal,
      mediaUso,
      avgPct: parseFloat(avgPct.toFixed(1)),
      mensal_pct: 100,
      anual_pct: parseFloat(avgPct.toFixed(1)),
    };
  }

  return { monthly, orcamento };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const resource = req.nextUrl.searchParams.get("resource") ?? "stats";

  try {
    const session = await auth();
    const token = session?.user?.accessToken;

    if (!token) {
      return NextResponse.json(
        { error: "Sessão ou Token não encontrado" },
        { status: 401 },
      );
    }

    // ── Sheet PAGAMENTOS ──────────────────────────────────────────────────────
    if (resource === "pagamentos") {
      const rows = await fetchPagamentosRows(token);
      return NextResponse.json(buildPagamentos(rows));
    }

    // ── Sheet GERAL (BASE VIGENTE 2024) ───────────────────────────────────────
    const rows = await fetchGeralRows(token);

    switch (resource) {
      case "stats":
        return NextResponse.json(buildStats(rows));

      case "editais": {
        const acc: Record<string, number> = {};
        for (const r of rows) {
          if (r.ano) acc[r.ano] = (acc[r.ano] ?? 0) + 1;
        }
        return NextResponse.json(
          Object.entries(acc)
            .map(([edital, total]) => ({ edital, total }))
            .sort((a, b) => Number(a.edital) - Number(b.edital)),
        );
      }

      case "uf": {
        const acc: Record<string, number> = {};
        for (const r of rows) {
          if (r.uf) acc[r.uf] = (acc[r.uf] ?? 0) + 1;
        }
        return NextResponse.json(
          Object.entries(acc)
            .map(([uf, total]) => ({ uf, total }))
            .sort((a, b) => b.total - a.total),
        );
      }

      case "recursos": {
        const acc: Record<string, number> = {};
        for (const r of rows) {
          if (!r.ano) continue;
          const edital = String(r.ano);
          acc[edital] = (acc[edital] ?? 0) + parseBRL(r.recurso_anual);
        }
        return NextResponse.json(
          Object.entries(acc)
            .map(([edital, total]) => ({ edital, total }))
            .sort((a, b) => Number(a.edital) - Number(b.edital)),
        );
      }

      case "comunidades":
        return NextResponse.json(rows);

      case "mapa": {
        // Query params opcionais para filtrar server-side
        const ufParam = req.nextUrl.searchParams.get("uf")?.toUpperCase() ?? "";
        const regiaoParam =
          req.nextUrl.searchParams.get("regiao")?.toLowerCase() ?? "";
        const vagasMin = Number(req.nextUrl.searchParams.get("vagas_min") ?? 0);
        const vagasMax = Number(
          req.nextUrl.searchParams.get("vagas_max") ?? 99_999,
        );

        const ufsDaRegiao = regiaoParam
          ? new Set(REGIOES[regiaoParam] ?? [])
          : null;

        function parseCoord(v: string): number {
          return parseFloat(v.trim().replace(",", "."));
        }

        const points: MapPoint[] = [];

        for (const r of rows) {
          const lat = parseCoord(r.latitude);
          const lng = parseCoord(r.longitude);

          // Descarta pontos sem coordenadas válidas
          if (isNaN(lat) || isNaN(lng)) continue;

          // Filtro de UF
          if (ufParam && r.uf !== ufParam) continue;

          // Filtro de região (ignorado se uf específica já foi passada)
          if (!ufParam && ufsDaRegiao && !ufsDaRegiao.has(r.uf)) continue;

          // Filtro de vagas
          const vagas = r.vagas_contratadas ?? 0;
          if (vagas < vagasMin || vagas > vagasMax) continue;

          points.push({
            id: r.contrato_ano,
            nome: r.razao_social,
            nome_fantasia: r.nome_fantasia,
            cnpj: r.cnpj,
            cidade: r.cidade,
            uf: r.uf,
            lat,
            lng,
            vagas_contratadas: vagas,
            adulto_masc: r.adulto_masc ?? 0,
            adulto_feminino: r.adulto_feminino ?? 0,
            maes: r.maes ?? 0,
            status_ct: r.status_ct,
            recurso_mensal: r.recurso_mensal,
          });
        }

        return NextResponse.json(points);
      }

      default:
        return NextResponse.json(
          { error: "Recurso inválido" },
          { status: 400 },
        );
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
