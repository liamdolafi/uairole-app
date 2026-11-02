import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";

/** "Eu vou": total de cada evento + quais o usuário marcou. */
export function useGoing(ids: string[]) {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<Set<string>>(new Set());
  const key = useMemo(() => [...ids].sort().join(","), [ids]);

  useEffect(() => {
    const list = key ? key.split(",") : [];
    if (!list.length) return;
    let alive = true;
    const sb = supabase;
    sb.rpc("going_counts", { p_events: list }).then(({ data, error }) => {
      if (!alive || error) return;
      const m: Record<string, number> = {};
      for (const r of (data ?? []) as { event_id: string; going: number }[]) m[r.event_id] = r.going;
      setCounts(m);
    });
    if (user) {
      sb.from("attendances")
        .select("event_id")
        .in("event_id", list)
        .then(({ data }) => alive && setMine(new Set((data ?? []).map((r) => r.event_id as string))));
    } else {
      setMine(new Set());
    }
    return () => {
      alive = false;
    };
  }, [key, user]);

  const toggle = useCallback(
    async (id: string) => {
      if (!user) return { needLogin: true as const };
      const sb = supabase;
      const was = mine.has(id);
      // atualiza na hora e desfaz se der erro
      setMine((s) => {
        const n = new Set(s);
        if (was) n.delete(id);
        else n.add(id);
        return n;
      });
      setCounts((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + (was ? -1 : 1)) }));
      const { error } = was
        ? await sb.from("attendances").delete().eq("event_id", id).eq("user_id", user.id)
        : await sb.from("attendances").insert({ event_id: id });
      if (error) {
        setMine((s) => {
          const n = new Set(s);
          if (was) n.add(id);
          else n.delete(id);
          return n;
        });
        setCounts((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + (was ? 1 : -1)) }));
        return { error: error.message };
      }
      return { ok: true as const };
    },
    [user, mine],
  );

  return { counts, mine, toggle };
}

export type GoingState = ReturnType<typeof useGoing>;
