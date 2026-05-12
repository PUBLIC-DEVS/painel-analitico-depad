import { auth } from "@/auth";
import { createGraphClient } from "@/lib/graph-client";
import { DASHBOARD_DEV_PREVIEW } from "@/lib/dashboard-dev-preview";

export async function GET() {
  const session = await auth();
  const token = session?.user?.accessToken;

  if (!token) {
    if (DASHBOARD_DEV_PREVIEW) {
      return Response.json({
        nome: "Validação local",
        email: "dev-preview@local",
      });
    }

    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const graph = createGraphClient(token);
  const { data } = await graph.get("/me");

  return Response.json({
    nome: data.displayName,
    email: data.mail,
  });
}
