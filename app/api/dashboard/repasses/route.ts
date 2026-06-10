import { NextResponse } from "next/server";
import { fetchPropostas } from "@/lib/transferegov";
import { getErrorMessage } from "@/lib/errors";

// Propostas de emenda (TransfereGov). Hoje serve o mock; quando fetchPropostas
// apontar pra API real, nada muda aqui. O cliente agrega/filtra em memória.
export async function GET() {
  try {
    return NextResponse.json(await fetchPropostas());
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
