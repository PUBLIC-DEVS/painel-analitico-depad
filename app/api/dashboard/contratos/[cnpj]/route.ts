import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchGeralRows } from "../_fetchers";
import { DASHBOARD_DEV_PREVIEW } from "@/lib/dashboard-dev-preview";
import { getDashboardDevRows } from "@/lib/dashboard-dev-data";
import { getErrorMessage } from "@/lib/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ cnpj: string }> }
) {
  try {
    const session = await auth();
    const token = session?.user?.accessToken;
    if (!token) {
      if (!DASHBOARD_DEV_PREVIEW) {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
      }
    }

    const { cnpj } = await params;
    const cnpjBuscado = cnpj.replace(/\D/g, "");
    const rows = token ? await fetchGeralRows(token) : getDashboardDevRows();

    const comunidade = rows.find(
      (r) => r.cnpj.replace(/\D/g, "") === cnpjBuscado
    );

    if (!comunidade) {
      return NextResponse.json(
        { error: "Comunidade não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(comunidade);
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
