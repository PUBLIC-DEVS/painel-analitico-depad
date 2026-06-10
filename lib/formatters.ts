/** Real (BRL) sem centavos: R$ 1.234 */
export function fBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);
}

/** Real compacto pra eixos de gráfico: R$1,2M, R$34K, ou o valor cheio se for pequeno. */
export function fBRLShort(v: number) {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}K`;
  return fBRL(v);
}

/** Lê um valor pt-BR ("R$ 1.234.567,89") de volta pra número. 0 se não der. */
export function parseBRL(v: string): number {
  const n = parseFloat(v.replace(/[R$\s.]/g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}
