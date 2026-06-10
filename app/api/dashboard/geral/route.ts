import { NextRequest, NextResponse } from "next/server";
import {
  getStats, getPorUf, getPorEdital, getRecursoPorEdital,
  getComunidades, getPontosMapa, getComunidadesUnificadas, getPagamentos,
} from "@/lib/dashboard-data";
import { getErrorMessage } from "@/lib/errors";

// Endpoint consumido no cliente pelo mapa (resource=uf) e pela tabela
// (resource=comunidades). Os Server Components do dashboard chamam a lib direto.
export async function GET(req: NextRequest) {
  const resource = req.nextUrl.searchParams.get("resource") ?? "stats";
  const uf = req.nextUrl.searchParams.get("uf") ?? undefined;

  try {
    switch (resource) {
      case "stats":
        return NextResponse.json(await getStats(uf));
      case "uf":
        return NextResponse.json(await getPorUf());
      case "editais":
        return NextResponse.json(await getPorEdital(uf));
      case "recursos":
        return NextResponse.json(await getRecursoPorEdital(uf));
      case "comunidades":
        return NextResponse.json(await getComunidades(uf));
      case "mapa":
        return NextResponse.json(getPontosMapa(uf));
      case "unificada":
        return NextResponse.json(getComunidadesUnificadas());
      case "pagamentos":
        return NextResponse.json(getPagamentos());
      default:
        return NextResponse.json({ error: "Recurso inválido" }, { status: 400 });
    }
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
