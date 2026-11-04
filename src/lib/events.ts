import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { EVENT_SELECT, PLAN_RANK, planOf, type EventWithVenue, type Thermo, type TrendingRow } from "@/lib/types";
import { nextOfSeries } from "@/lib/filters";

/** Eventos ativos que ainda não acabaram (o banco já filtra pela idade). */
export async function fetchUpcoming(): Promise<EventWithVenue[]> {
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("status", "ativo")
    .gt("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1000); // séries semanais criam uma linha por data (as listas mostram só a próxima)
  if (error) throw error;
  // Holofote > Destaque > Grátis, depois por horário
  return ((data ?? []) as EventWithVenue[]).sort(
    (a, b) => PLAN_RANK[planOf(b)] - PLAN_RANK[planOf(a)] || a.starts_at.localeCompare(b.starts_at),
  );
}

export async function fetchThermo(ids: string[]): Promise<Record<string, Thermo>> {
  if (!ids.length) return {};
  const { data, error } = await supabase.rpc("event_thermo", { p_events: ids });
  if (error) {
    console.warn("termômetro indisponível:", error.message);
    return {};
  }
  const map: Record<string, Thermo> = {};
  for (const t of (data ?? []) as Thermo[]) map[t.event_id] = t;
  return map;
}

/** Termômetro em tempo real: recarrega quando chega check-in novo (e a cada 2 min). */
export function useThermo(ids: string[]) {
  const [thermo, setThermo] = useState<Record<string, Thermo>>({});
  const key = useMemo(() => [...ids].sort().join(","), [ids]);

  useEffect(() => {
    const list = key ? key.split(",") : [];
    if (!list.length) return;
    let alive = true;
    const load = () => fetchThermo(list).then((t) => alive && setThermo(t));
    load();
    const timer = setInterval(load, 120000);
    const sb = supabase;
    const channel = sb
      .channel(`pulse-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_pulse" }, (payload) => {
        const id = (payload.new as { event_id?: string })?.event_id;
        if (id && list.includes(id)) load();
      })
      .subscribe();
    return () => {
      alive = false;
      clearInterval(timer);
      sb.removeChannel(channel);
    };
  }, [key]);

  return thermo;
}

/** "Em alta esta semana" (033): a pontuação vem do banco (que já respeita a idade). null = 033 ainda não rodou. */
export async function fetchTrending(limit = 10): Promise<TrendingRow[] | null> {
  const { data, error } = await supabase.rpc("trending_events", { p_limit: limit });
  if (error) return null;
  return (data ?? []) as TrendingRow[];
}

/** Junta a pontuação com os eventos já carregados. Sem pontuação: os próximos 7 dias (uma data por série). */
export function pickTrending(events: EventWithVenue[], rows: TrendingRow[] | null, limit = 10, now = new Date()): EventWithVenue[] {
  if (rows) {
    const byId = new Map(events.map((e) => [e.id, e]));
    return rows.map((r) => byId.get(r.event_id)).filter((e): e is EventWithVenue => !!e).slice(0, limit);
  }
  const until = now.getTime() + 7 * 86400000;
  return nextOfSeries(events.filter((e) => new Date(e.starts_at).getTime() < until && new Date(e.ends_at) > now))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, limit);
}
