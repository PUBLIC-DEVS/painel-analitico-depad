import rawData from "./contratos-data.json";

export type Contrato = {
  id: string;
  nome: string;
  cidade: string;
  uf: string;
  regiao: string;
  ano: string;
  vagas: number;
  masc: number;
  fem: number;
  maes: number;
  status: string;
  lat: number | null;
  lng: number | null;
  val_anual: number;
};

export const CONTRATOS: Contrato[] = rawData as Contrato[];

export const REGIOES = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"];

export const UFS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

export type Filtros = {
  ufs: string[];
  regioes: string[];
  vagasMin: number;
  vagasMax: number;
};

export const FILTROS_DEFAULT: Filtros = {
  ufs: [],
  regioes: [],
  vagasMin: 0,
  vagasMax: 500,
};

export function aplicarFiltros(contratos: Contrato[], filtros: Filtros): Contrato[] {
  return contratos.filter((c) => {
    if (filtros.ufs.length > 0 && !filtros.ufs.includes(c.uf)) return false;
    if (filtros.regioes.length > 0 && !filtros.regioes.includes(c.regiao)) return false;
    if (c.vagas < filtros.vagasMin) return false;
    if (c.vagas > filtros.vagasMax) return false;
    return true;
  });
}

export function calcularResumo(contratos: Contrato[]) {
  const total = contratos.length;
  const ativos = contratos.filter((c) => c.status === "ATIVO").length;
  const finalizados = contratos.filter((c) => c.status === "FINALIZADO").length;
  const rescindidos = contratos.filter((c) => c.status === "RESCINDIDO").length;
  const totalVagas = contratos.reduce((s, c) => s + c.vagas, 0);
  const totalMasc = contratos.reduce((s, c) => s + c.masc, 0);
  const totalFem = contratos.reduce((s, c) => s + c.fem, 0);
  const totalMaes = contratos.reduce((s, c) => s + c.maes, 0);
  const totalValAnual = contratos.reduce((s, c) => s + c.val_anual, 0);

  return { total, ativos, finalizados, rescindidos, totalVagas, totalMasc, totalFem, totalMaes, totalValAnual };
}

export function calcularPorUF(contratos: Contrato[]) {
  const map: Record<string, { contratos: number; vagas: number; val_anual: number }> = {};
  for (const c of contratos) {
    const uf = c.uf || "N/D";
    if (!map[uf]) map[uf] = { contratos: 0, vagas: 0, val_anual: 0 };
    map[uf].contratos++;
    map[uf].vagas += c.vagas;
    map[uf].val_anual += c.val_anual;
  }
  return Object.entries(map)
    .filter(([k]) => k !== "N/D" && k !== "")
    .sort((a, b) => b[1].contratos - a[1].contratos)
    .slice(0, 12)
    .map(([uf, data]) => ({ uf, ...data }));
}

export function calcularPorRegiao(contratos: Contrato[]) {
  const map: Record<string, { contratos: number; vagas: number }> = {};
  for (const c of contratos) {
    const reg = c.regiao || "N/D";
    if (!map[reg]) map[reg] = { contratos: 0, vagas: 0 };
    map[reg].contratos++;
    map[reg].vagas += c.vagas;
  }
  return Object.entries(map)
    .filter(([k]) => k !== "N/D" && k !== "")
    .map(([regiao, data]) => ({ regiao, ...data }));
}
