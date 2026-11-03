import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { EVENT_SELECT, PLAN_RANK, planOf, type EventWithVenue, type Thermo } from "@/lib/types";

/** Eventos ativos que ainda não acabaram (o banco já filtra pela idade). */
export async function fetchUpcoming(): Promise<EventWithVenue[]> {
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("status", "ativo")
    .gt("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(300);
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
