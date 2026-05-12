import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { DASHBOARD_DEV_PREVIEW } from "@/lib/dashboard-dev-preview";
import { getDashboardDevRows } from "@/lib/dashboard-dev-data";
import { getErrorMessage } from "@/lib/errors";

// ─── Types & Config ──────────────────────────────────────────────────────────

export interface Comunidade {
  contrato_ano:       string;
  razao_social:       string;
  nome_fantasia:      string;
  cnpj:               string;
  processo_mae:       string;
  cidade:             string;
  uf:                 string;
  contrato:           string;
  ano:                number;
  endereco:           string;
  telefone:           string;
  email:              string;
  vagas_contratadas:  number | null;
  adulto_masc:        number | null;
  adulto_feminino:    number | null;
  maes:               number | null;
  recurso_anual:      string;
  recurso_mensal:     string;
  status_ct:          string;
  data_inicial_ct:    string;
  data_vencimento_ct: string;
  diminuicao_vagas:   string;
  sei_assinatura:     string;
  assinado:           string;
  latitude:           string;
  longitude:          string;
}

const WORKSHEET = encodeURIComponent("BASE");
const GRAPH_ENDPOINT =
  `https://graph.microsoft.com/v1.0/sites/` +
  `mdsgov.sharepoint.com,52f29331-c2f3-49dd-a449-d2c173ec9eba,5f34bf7f-2136-4760-b81b-72e398af492d` +
  `/drive/root:/Dashboard/painel_depad_leve.xlsx:/workbook/worksheets('${WORKSHEET}')/usedRange?$select=text`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseBRL(v: string): number {
  const n = parseFloat(
    v.replace(/\s/g, "").replace("R$", "").replace(/\./g, "").replace(",", ".")
  );
  return isNaN(n) ? 0 : n;
}

function parseRow(row: string[]): Comunidade | null {
  const contratoAno = row[0]?.trim() ?? "";
  if (!contratoAno || contratoAno === "CONTRATO/ANO") return null;

  return {
    contrato_ano:       contratoAno,
    razao_social:       row[1]?.trim()  ?? "",
    nome_fantasia:      row[2]?.trim()  ?? "",
    cnpj:               row[3]?.trim()  ?? "",
    processo_mae:       row[4]?.trim()  ?? "",
    cidade:             row[5]?.trim()  ?? "",
    uf:                 row[6]?.trim()  ?? "",
    contrato:           row[7]?.trim()  ?? "",
    ano:                parseInt(row[8] ?? "", 10) || 0,
    endereco:           row[9]?.trim()  ?? "",
    telefone:           row[10]?.trim() ?? "",
    email:              row[11]?.trim() ?? "",
    vagas_contratadas:  parseInt(row[13], 10) || 0,
    adulto_masc:        parseInt(row[14], 10) || 0,
    adulto_feminino:    parseInt(row[15], 10) || 0,
    maes:               parseInt(row[16], 10) || 0,
    recurso_anual:      row[17]?.trim() ?? "",
    recurso_mensal:     row[18]?.trim() ?? "",
    status_ct:          row[19]?.trim() ?? "",
    data_inicial_ct:    row[20]?.trim() ?? "",
    data_vencimento_ct: row[21]?.trim() ?? "",
    diminuicao_vagas:   row[22]?.trim() ?? "",
    sei_assinatura:     row[23]?.trim() ?? "",
    assinado:           row[24]?.trim() ?? "",
    latitude:           row[25]?.trim() ?? "",
    longitude:          row[26]?.trim() ?? "",
  };
}

// ─── Fetch com Cache ──────────────────────────────────────────────────────────

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

    return json.text
      .slice(1)
      .flatMap((row) => {
        const c = parseRow(row);
        return c ? [c] : [];
      });
  },
  ["depad-base-vigente-2024"],
  { revalidate: 3600, tags: ["dashboard-data"] }
);

// ─── Aggregations ─────────────────────────────────────────────────────────────

function buildStats(rows: Comunidade[]) {
  let totalVagas = 0, vagasMasc = 0, vagasFem = 0, vagasMaes = 0, orcamento = 0;

  for (const r of rows) {
    totalVagas += r.vagas_contratadas ?? 0;
    vagasMasc  += r.adulto_masc       ?? 0;
    vagasFem   += r.adulto_feminino   ?? 0;
    vagasMaes  += r.maes              ?? 0;
    orcamento  += parseBRL(r.recurso_anual);
  }

  return {
    totalVagas,
    vagasMasculinas:         vagasMasc,
    vagasFemininas:          vagasFem,
    vagasParaMaes:           vagasMaes,
    orcamentoAnual:          new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(orcamento),
    contratosRegistrados:    rows.length, // ← adicionado
    comunidadesTerapeuticas: rows.length,
  };
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const resource = req.nextUrl.searchParams.get("resource") ?? "stats";

  try {
    const session = await auth();
    const token = session?.user?.accessToken;

    if (!token) {
      if (!DASHBOARD_DEV_PREVIEW) {
        return NextResponse.json({ error: "Sessão ou Token não encontrado" }, { status: 401 });
      }
    }

    const rows = token ? await fetchSheetRows(token) : getDashboardDevRows();

    switch (resource) {
      case "stats":
        return NextResponse.json(buildStats(rows));

      case "editais": {
        const editais = rows.reduce((acc: Record<string, number>, r) => {
          if (r.ano) acc[r.ano] = (acc[r.ano] ?? 0) + 1;
          return acc;
        }, {});
        return NextResponse.json(
          Object.entries(editais)
            .map(([edital, total]) => ({ edital, total }))
            .sort((a, b) => Number(a.edital) - Number(b.edital))
        );
      }

      case "uf": {
        const ufs = rows.reduce((acc: Record<string, number>, r) => {
          if (r.uf) acc[r.uf] = (acc[r.uf] ?? 0) + 1;
          return acc;
        }, {});
        return NextResponse.json(
          Object.entries(ufs)
            .map(([uf, total]) => ({ uf, total }))
            .sort((a, b) => b.total - a.total)
        );
      }

      case "recursos": {
        const recursos = rows.reduce((acc: Record<string, number>, r) => {
          if (!r.ano) return acc;
          const edital = String(r.ano);
          acc[edital] = (acc[edital] ?? 0) + parseBRL(r.recurso_anual);
          return acc;
        }, {});
        return NextResponse.json(
          Object.entries(recursos)
            .map(([edital, total]) => ({ edital, total }))
            .sort((a, b) => Number(a.edital) - Number(b.edital))
        );
      }

      case "comunidades":
        return NextResponse.json(rows);

      default:
        return NextResponse.json({ error: "Recurso inválido" }, { status: 400 });
    }
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
