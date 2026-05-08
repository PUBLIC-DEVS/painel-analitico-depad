import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchGeralRows } from "../_fetchers";

export async function GET(
  _req: NextRequest,
  { params }: { params: { cnpj: string } }
) {
  try {
    const session = await auth();
    const token = session?.user?.accessToken;
    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const cnpjBuscado = params.cnpj.replace(/\D/g, "");
    const rows = await fetchGeralRows(token);

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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}