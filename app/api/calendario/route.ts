import { NextResponse } from "next/server";
import { getEventos } from "@/lib/calendario";
import { getErrorMessage } from "@/lib/errors";

export async function GET() {
  try {
    return NextResponse.json(await getEventos());
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
