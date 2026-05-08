import type {
  Comunidade,
  MapPoint,
  MonthEntry,
  OrcamentoEntry,
  PagamentosData,
} from "./_types";
import { parseBRL, parseNum } from "./_parsers";

const MONTHS_PT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const YEAR_COLS: Record<
  string,
  { valorAnual: number; valorMensal: number; firstPago: number }
> = {
  "2025": { valorAnual: 8,  valorMensal: 9,  firstPago: 12 },
  "2026": { valorAnual: 84, valorMensal: 85, firstPago: 88 },
};

export function buildStats(rows: Comunidade[]) {
  let totalVagas = 0, vagasMasc = 0, vagasFem = 0, vagasMaes = 0, orcamento = 0;

  for (const r of rows) {
    totalVagas += r.vagas_contratadas;
    vagasMasc  += r.adulto_masc;
    vagasFem   += r.adulto_feminino;
    vagasMaes  += r.maes;
    orcamento  += parseBRL(r.recurso_anual);
  }

  return {
    totalVagas,
    vagasMasculinas:         vagasMasc,
    vagasFemininas:          vagasFem,
    vagasParaMaes:           vagasMaes,
    orcamentoAnual:          new Intl.NumberFormat("pt-BR", {
                               style: "currency",
                               currency: "BRL",
                             }).format(orcamento),
    contratosRegistrados:    rows.length,
    comunidadesTerapeuticas: rows.length,
  };
}

export function buildMapa(rows: Comunidade[]): MapPoint[] {
  return rows
    .filter((r) => r.latitude && r.longitude)
    .map((r) => ({
      // cnpj + contrato_ano garante unicidade mesmo quando o CNPJ se repete
      id:                `${r.cnpj.replace(/\D/g, "")}_${r.contrato_ano}`,
      contrato_ano:      r.contrato_ano,
      nome:              r.razao_social,
      nome_fantasia:     r.nome_fantasia,
      cnpj:              r.cnpj,
      cidade:            r.cidade,
      uf:                r.uf,
      lat:               parseFloat(r.latitude.replace(",", ".")),
      lng:               parseFloat(r.longitude.replace(",", ".")),
      vagas_contratadas: r.vagas_contratadas,
      adulto_masc:       r.adulto_masc,
      adulto_feminino:   r.adulto_feminino,
      maes:              r.maes,
      recurso_mensal:    r.recurso_mensal,
      status_ct:         r.status_ct,
    }))
    .filter((p) => !isNaN(p.lat) && !isNaN(p.lng));
}

export function buildPagamentos(rows: string[][]): PagamentosData {
  const monthly:   Record<string, MonthEntry[]>   = {};
  const orcamento: Record<string, OrcamentoEntry> = {};

  for (const year of Object.keys(YEAR_COLS)) {
    const { valorAnual, valorMensal, firstPago } = YEAR_COLS[year];

    const monthSums = MONTHS_PT.map((mes) => ({ mes, pago: 0, previsto: 0 }));
    let totalAnual = 0, totalMensal = 0;

    for (const row of rows) {
      const va = parseNum(row[valorAnual] ?? "");
      const vm = parseNum(row[valorMensal] ?? "");
      totalAnual  += va;
      totalMensal += vm;

      for (let m = 0; m < 12; m++) {
        const pagoCol = firstPago + m * 6;
        monthSums[m].pago     += parseNum(row[pagoCol] ?? "");
        monthSums[m].previsto += vm;
      }
    }

    monthly[year] = monthSums;

    const totalPago  = monthSums.reduce((acc, m) => acc + m.pago,     0);
    const totalPrev  = monthSums.reduce((acc, m) => acc + m.previsto, 0);
    const paidMonths = monthSums.filter((m) => m.pago > 0);
    const mediaUso   = paidMonths.length > 0 ? totalPago / paidMonths.length : 0;
    const avgPct     = totalPrev > 0 ? (totalPago / totalPrev) * 100 : 0;

    orcamento[year] = {
      anual:      totalAnual,
      mensal:     totalMensal,
      mediaUso,
      avgPct:     parseFloat(avgPct.toFixed(1)),
      mensal_pct: 100,
      anual_pct:  parseFloat(avgPct.toFixed(1)),
    };
  }

  return { monthly, orcamento };
}