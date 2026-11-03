import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { T } from "@/components/ui";
import { formatDayMonth } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { PLAN_LABEL, type PlanSubscription } from "@/lib/types";

type Sub = PlanSubscription & { event: { title: string } | null };

/** "Seu plano" do organizador (os pedidos e a ativação ficam no site, em Planos e no Painel) */
export function MyPlan({ userId }: { userId: string }) {
  const [subs, setSubs] = useState<Sub[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      const now = new Date().toISOString();
      supabase
        .from("plan_subscriptions")
        .select("*, event:events(title)")
        .eq("organizer_id", userId)
        .eq("status", "ativo")
        .lte("starts_at", now)
        .gt("ends_at", now)
        .order("ends_at")
        .then(({ data, error }) => alive && setSubs(error ? [] : ((data ?? []) as Sub[])));
      return () => {
        alive = false;
      };
    }, [userId]),
  );

  if (subs === null) return null;
  return (
    <View style={{ gap: 4 }}>
      <T size={14} weight="semibold">
        Seu plano: {subs.length ? "" : "Grátis"}
      </T>
      {subs.map((s) => (
        <T key={s.id} size={14} color={C.accent}>
          {PLAN_LABEL[s.plan]} {s.period === "mensal" ? `mensal até ${formatDayMonth(s.ends_at)}` : `em “${s.event?.title ?? "evento"}”`}
          {s.launch_offer ? " (oferta de lançamento)" : ""}
        </T>
      ))}
    </View>
  );
}
