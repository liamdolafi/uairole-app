import { useFocusEffect } from "expo-router";
import { CalendarDays, CalendarRange, Check, Flame, Gift } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import { HolofoteIcon, Icon } from "@/components/icons";
import { MethodPicker } from "@/components/method-picker";
import { MyPlan } from "@/components/my-plan";
import { Button, Card, Chip, ErrorBox, Loading, Row, Screen, T } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { useAppConfig } from "@/lib/app-config";
import { formatReais, formatWhen } from "@/lib/format";
import { startPayment } from "@/lib/payments";
import { supabase } from "@/lib/supabase";
import { C, R } from "@/lib/theme";
import { planPrice, type PaymentMethod, type PlanPeriod } from "@/lib/types";

type Paid = "destaque" | "holofote";
const ITEMS: Record<Paid, string[]> = {
  destaque: ["Aparece no topo da lista", "Selo Destaque no card", "Pino maior no mapa"],
  holofote: [
    "Tudo do Destaque e primeiro lugar da lista",
    "Carrossel “Em destaque” no topo da Descobrir",
    "Pino maior e com brilho no mapa",
    "Notificação pros seguidores e pra quem curte a categoria",
    "Post fixado no Feed e estatísticas avançadas",
  ],
};

/** Planos para organizadores (a compra no app depende da chave das lojas: REGRAS_DAS_LOJAS.md) */
export default function PlanosScreen() {
  const { profile } = useAuth();
  const { info, planPurchase } = useAppConfig();
  const [plan, setPlan] = useState<Paid>("destaque");
  const [period, setPeriod] = useState<PlanPeriod>("mensal");
  const [eventId, setEventId] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [events, setEvents] = useState<{ id: string; title: string; starts_at: string; ends_at: string }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useFocusEffect(
    useCallback(() => {
      if (!profile) return;
      supabase
        .from("events")
        .select("id,title,starts_at,ends_at")
        .eq("organizer_id", profile.id)
        .eq("status", "ativo")
        .gt("ends_at", new Date().toISOString())
        .order("starts_at")
        .limit(40)
        .then(({ data }) => setEvents(data ?? []));
    }, [profile]),
  );

  if (!profile) return <Screen padTop={false}><Loading /></Screen>;

  async function pay() {
    setErr("");
    if (period === "evento" && !eventId) return setErr("Escolha o evento.");
    setBusy(true);
    const e = await startPayment({ kind: "plano", method, plan, period, eventId: period === "evento" ? eventId : null });
    setBusy(false);
    if (e) setErr(e);
  }

  return (
    <Screen padTop={false}>
      <Card>
        <MyPlan userId={profile.id} />
      </Card>
      <T size={14} color={C.muted}>Publicar é sempre grátis. Com um plano, seu rolê aparece mais.</T>

      {planPurchase && info.launch_remaining > 0 ? (
        <Card style={{ borderColor: `${C.warn}66`, backgroundColor: `${C.warn}14` }}>
          <Row>
            <Icon icon={Gift} size={18} color={C.warn} />
            <T weight="semibold">Oferta de lançamento</T>
          </Row>
          <T size={13}>Os {info.launch_slots} primeiros parceiros ganham 1 mês de Destaque grátis. Restam {info.launch_remaining} vagas. Fala com a gente!</T>
        </Card>
      ) : null}

      {(["destaque", "holofote"] as Paid[]).map((p) => {
        const on = plan === p;
        return (
          <Pressable
            key={p}
            onPress={() => setPlan(p)}
            accessibilityRole={planPurchase ? "radio" : undefined}
            accessibilityState={planPurchase ? { checked: on } : undefined}
            disabled={!planPurchase}
            style={{ padding: 16, gap: 8, borderRadius: R.xl, borderWidth: 1, borderColor: planPurchase && on ? C.accent : C.line, backgroundColor: planPurchase && on ? C.accentSoft : C.surface }}
          >
            <Row>
              {p === "holofote" ? <HolofoteIcon size={18} color={C.accent} /> : <Icon icon={Flame} size={18} color={C.warn} />}
              <T size={20} weight="display">{p === "holofote" ? "Holofote" : "Destaque"}</T>
            </Row>
            {planPurchase ? (
              <T size={14} weight="semibold">{formatReais(planPrice(info, p, "evento"))} por evento · ou {formatReais(planPrice(info, p, "mensal"))} por mês</T>
            ) : null}
            {ITEMS[p].map((i) => (
              <Row key={i} style={{ alignItems: "flex-start" }}>
                <Icon icon={Check} size={16} color={C.ok} />
                <T size={13} style={{ flex: 1 }}>{i}</T>
              </Row>
            ))}
          </Pressable>
        );
      })}

      {planPurchase ? (
        <Card>
          <T weight="semibold">Por quanto tempo?</T>
          {(
            [
              ["evento", "Só este evento", "Vale até o fim do evento escolhido.", CalendarDays],
              ["mensal", "Mensal", "30 dias pra todos os seus eventos. Avisamos 3 dias antes de acabar.", CalendarRange],
            ] as const
          ).map(([id, t, sub, ic]) => (
            <Pressable key={id} onPress={() => setPeriod(id)} accessibilityRole="radio" accessibilityState={{ checked: period === id }} style={{ flexDirection: "row", gap: 10, padding: 12, minHeight: 44, borderRadius: R.lg, borderWidth: 1, borderColor: period === id ? C.accent : C.line, backgroundColor: period === id ? C.accentSoft : C.surface }}>
              <Icon icon={ic} size={20} color={C.accent} />
              <View style={{ flex: 1 }}>
                <Row style={{ justifyContent: "space-between" }}>
                  <T weight="semibold">{t}</T>
                  <T weight="display">{formatReais(planPrice(info, plan, id))}{id === "mensal" ? "/mês" : ""}</T>
                </Row>
                <T size={12} color={C.muted}>{sub}</T>
              </View>
            </Pressable>
          ))}
          {period === "evento" ? (
            events === null ? (
              <Loading />
            ) : events.length === 0 ? (
              <T size={13} color={C.muted}>Você ainda não tem eventos pra frente.</T>
            ) : (
              <View style={{ gap: 8 }}>
                <T size={13} weight="semibold">Qual evento?</T>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {events.map((e) => (
                    <Chip key={e.id} active={eventId === e.id} onPress={() => setEventId(e.id)}>{`${e.title} · ${formatWhen(e.starts_at, e.ends_at)}`}</Chip>
                  ))}
                </View>
              </View>
            )
          ) : null}
          <MethodPicker value={method} onChange={setMethod} />
          {err ? <ErrorBox message={err} /> : null}
          <Button loading={busy} onPress={pay}>Pagar {formatReais(planPrice(info, plan, period))}</Button>
          <T size={12} color={C.muted}>O plano ativa sozinho assim que o pagamento for confirmado, e você recebe um aviso.</T>
        </Card>
      ) : (
        <Card>
          <T size={14} color={C.muted}>A contratação dos planos não está disponível no app. Quando seu plano estiver ativo, ele aparece aqui em cima.</T>
        </Card>
      )}
    </Screen>
  );
}
