import { unstable_cache } from "next/cache";
import type { Comunidade } from "./_types";
import { parseGeralRow } from "./_parsers";

const SITE =
  "mdsgov.sharepoint.com," +
  "52f29331-c2f3-49dd-a449-d2c173ec9eba," +
  "5f34bf7f-2136-4760-b81b-72e398af492d";

const BASE_URL =
  `https://graph.microsoft.com/v1.0/sites/${SITE}` +
  `/drive/root:/Dashboard/painel_depad_leve.xlsx:/workbook/worksheets`;

const GERAL_ENDPOINT =
  `${BASE_URL}('${encodeURIComponent("BASE")}')/usedRange?$select=text`;

const PAGAMENTOS_ENDPOINT =
  `${BASE_URL}('${encodeURIComponent("PAGAMENTOS")}')/usedRange?$select=values`;

export const REGIOES: Record<string, string[]> = {
  norte:          ["AC", "AM", "AP", "PA", "RO", "RR", "TO"],
  nordeste:       ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
  "centro-oeste": ["DF", "GO", "MS", "MT"],
  sudeste:        ["ES", "MG", "RJ", "SP"],
  sul:            ["PR", "RS", "SC"],
};

export const fetchGeralRows = unstable_cache(
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
  { revalidate: 3600, tags: ["dashboard-data"] }
);

export const fetchPagamentosRows = unstable_cache(
  async (token: string): Promise<string[][]> => {
    const res = await fetch(PAGAMENTOS_ENDPOINT, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Graph API (pagamentos) ${res.status}: ${text.slice(0, 300)}`);
    }
    const json = await res.json();
    const data: unknown[][] = json.values;
    if (!data || !Array.isArray(data)) return [];
    return data
      .slice(1)
      .filter((row) => row.some((cell) => cell !== "" && cell !== null))
      .map((row) => row.map((cell) => (cell == null ? "" : String(cell))));
  },
  ["depad-pagamentos-v3"],
  { revalidate: 3600, tags: ["dashboard-data"] }
);