/**
 * Calendário de eventos do usuário (Teams/Outlook via Microsoft Graph).
 *
 * Com login, busca os eventos do calendário (/me/calendarView) — reuniões do
 * Teams aparecem aí. Sem token (dev), devolve uns eventos de exemplo pra UI viver.
 */

import { auth } from "@/auth";
import { config } from "@/config";

export interface Evento {
  id: string;
  titulo: string;
  inicio: string; // ISO
  fim: string; // ISO
  local: string;
  online: boolean;
  organizador: string;
}

const GRAPH = "https://graph.microsoft.com/v1.0";

/** Eventos do mês corrente ± um mês — o suficiente pro calendário navegar perto. */
export async function getEventos(): Promise<Evento[]> {
  // Em dev (modo local) mostra exemplos, sem tocar na Graph — igual ao resto.
  if (config.dashboard.useLocalFiles) return eventosExemplo();
  const token = (await auth())?.user?.accessToken;
  if (!token) return eventosExemplo();

  const agora = new Date();
  const inicio = new Date(agora.getFullYear(), agora.getMonth() - 1, 1).toISOString();
  const fim = new Date(agora.getFullYear(), agora.getMonth() + 2, 0).toISOString();
  const url =
    `${GRAPH}/me/calendarView?startDateTime=${inicio}&endDateTime=${fim}` +
    `&$select=subject,start,end,location,isOnlineMeeting,organizer&$orderby=start/dateTime&$top=200`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Prefer: 'outlook.timezone="America/Sao_Paulo"' },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Graph ${res.status}`);
    const json = await res.json();
    return (json.value ?? []).map(mapearEvento);
  } catch (err) {
    console.error("[calendario] falha na Graph:", err);
    return [];
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapearEvento(e: any): Evento {
  return {
    id: e.id,
    titulo: e.subject || "(Sem título)",
    inicio: e.start?.dateTime ?? "",
    fim: e.end?.dateTime ?? "",
    local: e.location?.displayName ?? "",
    online: !!e.isOnlineMeeting,
    organizador: e.organizer?.emailAddress?.name ?? "",
  };
}

/* ── exemplo (dev sem login) — eventos em torno de hoje ── */
function eventosExemplo(): Evento[] {
  const base = new Date();
  const em = (dias: number, h: number, m = 0) => {
    const d = new Date(base);
    d.setDate(d.getDate() + dias);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  const ev = (id: string, titulo: string, dias: number, h: number, dur: number, online = true, local = "Teams"): Evento => ({
    id,
    titulo,
    inicio: em(dias, h),
    fim: em(dias, h + dur),
    local,
    online,
    organizador: "DEPAD",
  });
  return [
    ev("1", "Reunião de equipe DEPAD", 0, 10, 1),
    ev("2", "Alinhamento de contratos", 0, 15, 1),
    ev("3", "Análise de repasses — TransfereGov", 1, 9, 2),
    ev("4", "Comitê CEBAS", 2, 14, 1, false, "Sala 3 — MDS"),
    ev("5", "Revisão da base de dados", 4, 11, 1),
    ev("6", "Planejamento mensal", 7, 9, 2),
  ];
}
