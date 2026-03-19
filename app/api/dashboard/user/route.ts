import { auth } from "@/auth";
import { createGraphClient } from "@/lib/graph-client";

export async function GET() {
  const session = await auth();

  if (!session) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const graph = createGraphClient(session.user.accessToken!);
  const { data } = await graph.get("/me");

  return Response.json({
    nome: data.displayName,
    email: data.mail,
  });
}