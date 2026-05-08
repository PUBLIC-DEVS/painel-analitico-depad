import type { Comunidade } from "./_types";

export function parseBRL(v: string): number {
  const n = parseFloat(
    v.replace(/\s/g, "").replace("R$", "").replace(/\./g, "").replace(",", ".")
  );
  return isNaN(n) ? 0 : n;
}

export function parseNum(v: string): number {
  if (!v || v === "N/A" || v === "false" || v.startsWith("=")) return 0;
  if (!v.includes(",")) {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }
  const n = parseFloat(v.replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

export function parseGeralRow(row: string[]): Comunidade | null {
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
    ano:                parseInt(row[8]  ?? "", 10) || 0,
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