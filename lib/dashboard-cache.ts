/**
 * Cache client-side em memória para as chamadas ao /api/dashboard.
 * Evita re-fetches desnecessários durante a sessão.
 * TTL padrão: 5 minutos (os dados reais são invalidados a cada 1h no servidor).
 */

const store = new Map<string, { data: unknown; expiresAt: number }>();

const DEFAULT_TTL_MS = 5 * 60 * 1_000; // 5 min

export async function fetchDashboard<T>(
  resource: string,
  ttl = DEFAULT_TTL_MS
): Promise<T> {
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