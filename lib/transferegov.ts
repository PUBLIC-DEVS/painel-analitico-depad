/**
 * Setor Repasses — emendas parlamentares vindas do TransfereGov.
 *
 * O painel de referência (Power BI) mostra: Indicação Total, Qtd Propostas,
 * Tempo médio de Formalização, Contrapartida, e quebras por Partido / Situação /
 * Modalidade / Secretaria Finalística, mais a Demanda por Técnico (GND3/GND4).
 * Tudo aqui já está modelado em cima do tipo `Proposta`; a UI e as agregações
 * são prontas — falta só a fonte.
 *
 * 👉 PLUGUE AQUI: implemente `fetchPropostas()` chamando os endpoints do
 *    TransfereGov. Me passe as URLs (+ auth, se houver) que eu conecto. Mantendo
 *    o retorno no formato `Proposta[]`, nada mais precisa mudar.
 */

export interface Proposta {
  id: string;
  parlamentar: string; // autor da emenda
  partido: string;
  proponente: string; // entidade beneficiada
  cnpj: string;
  uf: string;
  municipio: string;
  modalidade: string; // "Termo de Fomento" | "Convênio" | ...
  situacao: string; // "CELEBRADO" | "IMPEDIMENTO TÉCNICO" | "CGIR" | ...
  secretaria: string; // "SENAEC" | "SENEV" | "SENATP" | ...
  analista: string;
  valorRepasse: number;
  contrapartida: number;
  valorGND3: number;
  valorGND4: number;
  diasFormalizacao: number | null;
  ano: number;
}

/**
 * Única função a implementar de verdade. Hoje devolve dados de DEMONSTRAÇÃO
 * (lib/transferegov-mock) só pra UI viver. Troque pelo fetch real:
 *
 *   const res = await fetch(`${BASE}/proposta?...`, { headers });
 *   return (await res.json()).map(mapearProposta);   // mapeie pro tipo Proposta
 *
 * Quando fizer isso, apague o import e o arquivo do mock.
 */
export async function fetchPropostas(): Promise<Proposta[]> {
  // TODO(transferegov): conectar aos endpoints reais e remover o mock.
  const { gerarPropostasMock } = await import("@/lib/transferegov-mock");
  return gerarPropostasMock();
}

/* ── agregações que o painel de Repasses consome (espelham os cards do BI) ── */

export interface ResumoRepasses {
  indicacaoTotal: number;
  qtdPropostas: number;
  tempoMedioFormalizacao: number; // dias
  contrapartida: number;
}

export function resumoRepasses(props: Proposta[]): ResumoRepasses {
  const comDias = props.filter((p) => p.diasFormalizacao != null);
  const somaDias = comDias.reduce((s, p) => s + (p.diasFormalizacao ?? 0), 0);
  return {
    indicacaoTotal: props.reduce((s, p) => s + p.valorRepasse, 0),
    qtdPropostas: props.length,
    tempoMedioFormalizacao: comDias.length ? Math.round(somaDias / comDias.length) : 0,
    contrapartida: props.reduce((s, p) => s + p.contrapartida, 0),
  };
}

/** Contagem de propostas por uma dimensão (partido, situação, modalidade…). */
export function contarPor(props: Proposta[], campo: keyof Proposta) {
  const m = new Map<string, number>();
  for (const p of props) {
    const k = String(p[campo] || "(Em branco)");
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m].map(([rotulo, total]) => ({ rotulo, total })).sort((a, b) => b.total - a.total);
}

/** Demanda por técnico: soma de GND3/GND4 e dias por analista (tabela do BI). */
export function demandaPorTecnico(props: Proposta[]) {
  const m = new Map<string, { gnd3: number; gnd4: number; dias: number }>();
  for (const p of props) {
    const a = m.get(p.analista) ?? { gnd3: 0, gnd4: 0, dias: 0 };
    a.gnd3 += p.valorGND3;
    a.gnd4 += p.valorGND4;
    a.dias += p.diasFormalizacao ?? 0;
    m.set(p.analista, a);
  }
  return [...m].map(([analista, v]) => ({ analista, ...v })).sort((a, b) => b.gnd3 - a.gnd3);
}
