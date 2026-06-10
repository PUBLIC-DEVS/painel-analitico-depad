import { NextRequest, NextResponse } from "next/server";
import { getComunidadesUnificadas } from "@/lib/dashboard-data";

/**
 * Autocomplete da busca de comunidades (navbar). Filtra por nome ou CNPJ e
 * devolve no máximo 8 sugestões. O CNPJ volta só com dígitos, pronto pra URL.
 */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").toLowerCase().trim();
  if (q.length < 2) return NextResponse.json([]);

  const digitos = q.replace(/\D/g, "");
  const resultados = (await getComunidadesUnificadas())
    .filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        (digitos.length >= 3 && c.cnpj.replace(/\D/g, "").includes(digitos)),
    )
    .slice(0, 8)
    .map((c) => ({
      cnpj: c.cnpj.replace(/\D/g, ""),
      nome: c.nome,
      uf: c.uf,
      cidade: c.cidade,
      tipo: c.tipo,
    }));

  return NextResponse.json(resultados);
}
