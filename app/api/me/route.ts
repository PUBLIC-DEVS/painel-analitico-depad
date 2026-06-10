import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Perfil do usuário logado. Nome/e-mail vêm da sessão; a foto é buscada na
 * Graph (/me/photo) e devolvida como data URL. Sem token (modo local), devolve
 * o que tiver — a navbar cai pras iniciais.
 */
export async function GET() {
  const session = await auth();
  const base = {
    nome: session?.user?.name ?? null,
    email: session?.user?.email ?? null,
    foto: null as string | null,
  };

  const token = session?.user?.accessToken;
  if (!token) return NextResponse.json(base);

  try {
    const res = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const tipo = res.headers.get("content-type") ?? "image/jpeg";
      const b64 = Buffer.from(await res.arrayBuffer()).toString("base64");
      base.foto = `data:${tipo};base64,${b64}`;
    }
  } catch {
    // sem foto não é erro — segue com as iniciais
  }

  return NextResponse.json(base);
}
