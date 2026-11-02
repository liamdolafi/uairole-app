import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { EVENT_SELECT, PLAN_RANK, planOf, type EventWithVenue, type Thermo } from "@/lib/types";
import { addDays, startOfDayBH, ymd } from "@/lib/format";

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
  // Rolê da noite > Destaque > Grátis, depois por horário
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

export type TimeFilter = "tudo" | "agora" | "hoje" | "amanha" | "fds";

export const TIME_FILTERS: { id: TimeFilter; label: string }[] = [
  { id: "tudo", label: "Tudo" },
  { id: "agora", label: "Agora" },
  { id: "hoje", label: "Hoje" },
  { id: "amanha", label: "Amanhã" },
  { id: "fds", label: "Fim de semana" },
];

/** O evento acontece (pelo menos em parte) dentro da janela escolhida? */
export function matchesTime(e: EventWithVenue, f: TimeFilter, now = new Date()) {
  if (f === "tudo") return true;
  const s = new Date(e.starts_at).getTime();
  const end = new Date(e.ends_at).getTime();
  const n = now.getTime();
  if (f === "agora") return s <= n && n < end;
  const today = startOfDayBH(ymd(now));
  let from: Date;
  let to: Date;
  if (f === "hoje") {
    from = today;
    to = addDays(today, 1);
  } else if (f === "amanha") {
    from = addDays(today, 1);
    to = addDays(today, 2);
  } else {
    // dia da semana em BH (0 = domingo)
    const dow = new Date(`${ymd(now)}T12:00:00-03:00`).getUTCDay();
    const toSat = dow === 0 ? -1 : 6 - dow;
    from = addDays(today, toSat);
    to = addDays(from, 2);
  }
  return s < to.getTime() && end > Math.max(from.getTime(), n);
}
