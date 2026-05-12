import { NextRequest, NextResponse } from "next/server";
import { createGraphClient } from "@/lib/graph-client";

import { auth } from "@/auth";
import { DASHBOARD_DEV_PREVIEW } from "@/lib/dashboard-dev-preview";
import { getDashboardDevRows } from "@/lib/dashboard-dev-data";

export async function GET(request: NextRequest) {
  const session = await auth();
  const token = session?.user?.accessToken;

  if (!token && !DASHBOARD_DEV_PREVIEW) {
    return NextResponse.json({ error: "Sessão ou Token não encontrado" }, { status: 401 });
  }

  const path = process.env.NEXT_PUBLIC_GRAPH_BASE_VIGENTE;

  try {
    if (!token && DASHBOARD_DEV_PREVIEW) {
      return NextResponse.json(getDashboardDevRows());
    }

    const client = createGraphClient(token || "");
    // Chamada exata solicitada com ?$select=text
    const response = await client.get(`${path}`, {
      params: { "$select": "text" }
    });

    const rows: string[][] = response.data.text;

    if (!rows || rows.length === 0) {
      return NextResponse.json([]);
    }

    // EXTRAÇÃO E FILTRAGEM
    // A primeira linha [0] são os cabeçalhos (ex: "UF", "Valor", "Comunidade")
    const headers = rows[0];
    
    // Transformamos as linhas restantes em objetos
    const dataMapped = rows.slice(1).map((row) => {
      const obj: Record<string, string | undefined> = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    // Exemplo de filtro opcional via Query Params (ex: ?uf=BA)
    const ufFilter = request.nextUrl.searchParams.get("uf");
    const finalData = ufFilter 
      ? dataMapped.filter(item => item.UF === ufFilter)
      : dataMapped;

    return NextResponse.json(finalData);

  } catch (error: unknown) {
    console.error("Erro Excel Graph:", error);
    return NextResponse.json({ error: "Falha ao processar planilha" }, { status: 500 });
  }
}
