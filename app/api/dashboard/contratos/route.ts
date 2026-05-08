import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchGeralRows, fetchPagamentosRows } from "./_fetchers";
import { buildStats, buildMapa, buildPagamentos } from "./_aggregations";
import { parseBRL } from "./_parsers";

export async function GET(req: NextRequest) {
  const resource = req.nextUrl.searchParams.get("resource") ?? "stats";

  try {
    const session = await auth();
    const token = session?.user?.accessToken;
    if (!token) {
      return NextResponse.json(
        { error: "Sessão ou Token não encontrado" },
        { status: 401 }
      );
    }

    if (resource === "pagamentos") {
      const rows = await fetchPagamentosRows(token);
      return NextResponse.json(buildPagamentos(rows));
    }

    const rows = await fetchGeralRows(token);

    switch (resource) {
      case "stats":
        return NextResponse.json(buildStats(rows));

      case "editais": {
        const acc: Record<string, number> = {};
        for (const r of rows) {
          if (r.ano) acc[r.ano] = (acc[r.ano] ?? 0) + 1;
        }
        return NextResponse.json(
          Object.entries(acc)
            .map(([edital, total]) => ({ edital, total }))
            .sort((a, b) => Number(a.edital) - Number(b.edital))
        );
      }

      case "uf": {
        const acc: Record<string, number> = {};
        for (const r of rows) {
          if (r.uf) acc[r.uf] = (acc[r.uf] ?? 0) + 1;
        }
        return NextResponse.json(
          Object.entries(acc)
            .map(([uf, total]) => ({ uf, total }))
            .sort((a, b) => b.total - a.total)
        );
      }

      case "recursos": {
        const acc: Record<string, number> = {};
        for (const r of rows) {
          if (!r.ano) continue;
          const edital = String(r.ano);
          acc[edital] = (acc[edital] ?? 0) + parseBRL(r.recurso_anual);
        }
        return NextResponse.json(
          Object.entries(acc)
            .map(([edital, total]) => ({ edital, total }))
            .sort((a, b) => Number(a.edital) - Number(b.edital))
        );
      }

      case "comunidades":
        return NextResponse.json(rows);

      case "mapa":
        return NextResponse.json(buildMapa(rows));

      default:
        return NextResponse.json({ error: "Recurso inválido" }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}