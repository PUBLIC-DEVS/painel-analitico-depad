/**
 * Dados de DEMONSTRAÇÃO do setor Repasses, no formato `Proposta`.
 *
 * Só pra UI viver enquanto não pluga o TransfereGov. As distribuições por partido/
 * situação/modalidade/secretaria seguem o painel do Power BI de referência, então
 * os gráficos saem com a cara certa. Determinístico (mesma seed → mesmos dados).
 *
 * ⚠️ Descartável: quando `fetchPropostas()` apontar pra API real, apague isto.
 */

import type { Proposta } from "@/lib/transferegov";

function prng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff);
}

// [valor, peso] — pesos espelham as contagens do Power BI.
const PARTIDOS: [string, number][] = [
  ["PT", 68], ["(Em branco)", 36], ["REPUBLICANOS", 32], ["PDT", 25], ["PL", 19],
  ["PSB", 12], ["PSOL", 12], ["PV", 9], ["PODEMOS", 7], ["UNIÃO", 7], ["MDB", 5],
  ["PCdoB", 5], ["NOVO", 4], ["PP", 2], ["PSD", 1], ["PSDB", 1], ["REDE", 1], ["SOLIDARIEDADE", 1],
];
const SITUACOES: [string, number][] = [
  ["CELEBRADO", 85], ["IMPEDIMENTO TÉCNICO", 48], ["CGIR", 36], ["PARECER", 35],
  ["NA ÁREA FINALISTICA", 26], ["(Em branco)", 14], ["EM DILIGÊNCIA PELA CGIR", 4],
];
const MODALIDADES: [string, number][] = [["Termo de Fomento", 216], ["Convênio", 17], ["(Em branco)", 15]];
const SECRETARIAS: [string, number][] = [["SENAEC", 171], ["SENEV", 49], ["SENATP", 16], ["(Em branco)", 12]];
const ANALISTAS = ["ALANA", "ÁREA FINALISTICA", "ATILA", "BRENDA", "BRUNO", "COMON", "COPRE", "KETLEN", "LUISA", "MARCELO", "MARCIO", "MARUCIA"];
const PARLAMENTARES = ["Adriana Ventura", "Airton Faleiro", "Ana Paula Lima", "Benedita da Silva", "Bia Kicis", "Camila Jara", "Célia Xakriabá", "Delegada Katarina", "Denise Pessôa", "(Em branco)"];
const UFS = ["SP", "MG", "RS", "BA", "CE", "PR", "PE", "RJ", "GO", "PA"];

function pool<T>(pares: [T, number][]): T[] {
  return pares.flatMap(([v, p]) => Array<T>(p).fill(v));
}

const QTD = 248;

export function gerarPropostasMock(): Proposta[] {
  const rnd = prng(2025);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
  const partidos = pool(PARTIDOS);
  const situacoes = pool(SITUACOES);
  const modalidades = pool(MODALIDADES);
  const secretarias = pool(SECRETARIAS);

  return Array.from({ length: QTD }, (_, i) => {
    const gnd3 = Math.round((50_000 + rnd() * 900_000) / 100) * 100;
    const gnd4 = rnd() < 0.4 ? Math.round((rnd() * 200_000) / 100) * 100 : 0;
    return {
      id: `prop-${i + 1}`,
      parlamentar: pick(PARLAMENTARES),
      partido: pick(partidos),
      proponente: `Instituição ${i + 1}`,
      cnpj: "",
      uf: pick(UFS),
      municipio: "",
      modalidade: pick(modalidades),
      situacao: pick(situacoes),
      secretaria: pick(secretarias),
      analista: pick(ANALISTAS),
      valorRepasse: gnd3 + gnd4,
      contrapartida: rnd() < 0.2 ? Math.round(rnd() * 50_000) : 0,
      valorGND3: gnd3,
      valorGND4: gnd4,
      diasFormalizacao: rnd() < 0.85 ? 20 + Math.floor(rnd() * 90) : null,
      ano: 2023 + Math.floor(rnd() * 3),
    };
  });
}
