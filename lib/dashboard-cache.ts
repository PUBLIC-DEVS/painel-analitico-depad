/**
 * Cache client-side em memória para as chamadas ao /api/dashboard/geral.
 * Evita re-fetch a cada troca de filtro/aba durante a sessão. São muitos dados,
 * então segurar o resultado em memória economiza rede e re-render.
 *
 * TTL padrão: 5 min (no servidor os dados já revalidam a cada 1h).
 */

const store = new Map<string, { data: unknown; expiresAt: number }>();

const DEFAULT_TTL_MS = 5 * 60 * 1_000;

export async function fetchDashboard<T>(resource: string, ttl = DEFAULT_TTL_MS): Promise<T> {
  const url = `/api/dashboard/geral?resource=${resource}`;

  const cached = store.get(url);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data as T;
  }

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`[dashboard/geral/${resource}] HTTP ${res.status}: ${body}`);
  }

  const data: T = await res.json();
  store.set(url, { data, expiresAt: Date.now() + ttl });
  return data;
}
