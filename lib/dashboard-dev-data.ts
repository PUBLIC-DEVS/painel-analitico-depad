import { CONTRATOS } from "@/lib/data/contratos";
import type {
  Comunidade,
  MonthEntry,
  OrcamentoEntry,
  PagamentosData,
} from "@/app/api/dashboard/contratos/_types";

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

function fakeCnpj(index: number) {
  const digits = String(10_000_000_000_000 + index + 1);
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function getDashboardDevRows(): Comunidade[] {
  return CONTRATOS.map((contrato, index) => {
    const annualValue = contrato.val_anual || contrato.vagas * 2_400 * 12;

    return {
      contrato_ano: contrato.id,
      razao_social: contrato.nome,
      nome_fantasia: contrato.nome,
      cnpj: fakeCnpj(index),
      processo_mae: "",
      cidade: contrato.cidade,
      uf: contrato.uf,
      contrato: contrato.id.split("/")[0] ?? contrato.id,
      ano: Number(contrato.ano) || 0,
      endereco: "",
      telefone: "",
      email: "",
      vagas_contratadas: contrato.vagas,
      adulto_masc: contrato.masc,
      adulto_feminino: contrato.fem,
      maes: contrato.maes,
      recurso_anual: formatBRL(annualValue),
      recurso_mensal: formatBRL(annualValue / 12),
      status_ct: contrato.status || "SEM STATUS",
      data_inicial_ct: "",
      data_vencimento_ct: "",
      diminuicao_vagas: "",
      sei_assinatura: "",
      assinado: "",
      latitude: contrato.lat == null ? "" : String(contrato.lat),
      longitude: contrato.lng == null ? "" : String(contrato.lng),
    };
  });
}

export function buildDashboardDevPagamentos(): PagamentosData {
  const annualTotal = CONTRATOS.reduce((sum, contrato) => {
    return sum + (contrato.val_anual || contrato.vagas * 2_400 * 12);
  }, 0);

  const monthlyForecast = annualTotal / 12;
  const monthly2025 = buildMonthly(monthlyForecast, 0.72, 7);
  const monthly2026 = buildMonthly(monthlyForecast * 1.08, 0.18, 2);

  return {
    monthly: {
      "2025": monthly2025,
      "2026": monthly2026,
    },
    orcamento: {
      "2025": buildOrcamento(monthly2025),
      "2026": buildOrcamento(monthly2026),
    },
  };
}

function buildMonthly(
  monthlyForecast: number,
  executionRatio: number,
  paidMonths: number,
): MonthEntry[] {
  return MONTHS_PT.map((mes, index) => {
    const paid = index < paidMonths ? monthlyForecast * executionRatio : 0;
    return {
      mes,
      pago: Math.round(paid),
      previsto: Math.round(monthlyForecast),
    };
  });
}

function buildOrcamento(months: MonthEntry[]): OrcamentoEntry {
  const anual = months.reduce((sum, month) => sum + month.previsto, 0);
  const totalPago = months.reduce((sum, month) => sum + month.pago, 0);
  const paidMonths = months.filter((month) => month.pago > 0);
  const mediaUso =
    paidMonths.length > 0 ? totalPago / paidMonths.length : 0;
  const avgPct = anual > 0 ? Number(((totalPago / anual) * 100).toFixed(1)) : 0;

  return {
    anual,
    mensal: months[0]?.previsto ?? 0,
    mediaUso,
    avgPct,
    mensal_pct: 100,
    anual_pct: avgPct,
  };
}
