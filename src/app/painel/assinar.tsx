import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { CalendarDays, CalendarRange, Check, ShieldCheck } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import { Icon } from "@/components/icons";
import { MethodPicker } from "@/components/method-picker";
import { SoonBox } from "@/components/soon-box";
import { Button, Card, Chip, ErrorBox, Loading, Row, Screen, T } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { useAppConfig } from "@/lib/app-config";
import { formatReais, formatWhen } from "@/lib/format";
import { choiceToBody, startPayment } from "@/lib/payments";
import { supabase } from "@/lib/supabase";
import { C, R } from "@/lib/theme";
import { PAYMENT_SOON_MESSAGE, PLAN_FEATURES, PLAN_LABEL, planPrice, type PayChoice, type PlanPeriod } from "@/lib/types";

type Paid = "destaque" | "holofote";
type Ev = { id: string; title: string; starts_at: string; ends_at: string };

/** Página de pagamento do plano dentro do app: resumo, Pix/crédito/débito e pagar */
export default function AssinarScreen() {
  const params = useLocalSearchParams<{ plano?: string; periodo?: string; evento?: string }>();
  const { profile } = useAuth();
  const { info } = useAppConfig();
  const [plan, setPlan] = useState<Paid>(params.plano === "holofote" ? "holofote" : "destaque");
  const [period, setPeriod] = useState<PlanPeriod>(params.periodo === "evento" ? "evento" : "mensal");
  const [eventId, setEventId] = useState(params.evento ?? "");
  const [events, setEvents] = useState<Ev[] | null>(null);
  const [choice, setChoice] = useState<PayChoice>("pix");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [soon, setSoon] = useState<{ requested: boolean } | null>(null);

  const profileId = profile?.id;
  useFocusEffect(
    useCallback(() => {
      if (!profileId) return;
      supabase
        .from("events")
        .select("id,title,starts_at,ends_at")
        .eq("organizer_id", profileId)
        .eq("status", "ativo")
        .gt("ends_at", new Date().toISOString())
        .order("starts_at")
        .limit(40)
        .then(({ data }) => setEvents((data ?? []) as Ev[]));
    }, [profileId]),
  );

  if (!profile) return <Screen padTop={false}><Loading /></Screen>;
  const price = planPrice(info, plan, period);
  const ev = events?.find((e) => e.id === eventId);

  async function pay() {
    setErr("");
    setSoon(null);
    if (period === "evento" && !eventId) return setErr("Escolha o evento.");
    setBusy(true);
    const e = await startPayment({ kind: "plano", plan, period, eventId: period === "evento" ? eventId : null, ...choiceToBody(choice) });
    if (e?.notConfigured) {
      // cria um pedido pro admin ver (nada é cobrado)
      const { error } = await supabase.rpc("request_plan", { p_plan: plan, p_period: period, p_event: period === "evento" ? eventId : null });
      setSoon({ requested: !error });
    } else if (e) setErr(e.error);
    setBusy(false);
  }

  return (
    <Screen padTop={false}>
      <Card>
        <T weight="semibold">Plano</T>
        <Row>
          {(["destaque", "holofote"] as Paid[]).map((p) => (
            <View key={p} style={{ flex: 1 }}>
              <Chip active={plan === p} onPress={() => setPlan(p)}>{PLAN_LABEL[p]}</Chip>
            </View>
          ))}
        </Row>
        {PLAN_FEATURES[plan].map((f) => (
          <Row key={f} style={{ alignItems: "flex-start" }}>
            <Icon icon={Check} size={16} color={C.ok} />
            <T size={13} style={{ flex: 1 }}>{f}</T>
          </Row>
        ))}
      </Card>

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
            <View style={{ flex: 1, gap: 2 }}>
              <Row style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
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
            <View style={{ gap: 8 }}>
              <T size={13} color={C.muted}>Você ainda não tem eventos pra frente.</T>
              <Button small variant="ghost" onPress={() => router.push({ pathname: "/painel/evento/[id]", params: { id: "novo" } })}>Criar evento</Button>
            </View>
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
      </Card>

      <Card>
        <T weight="semibold">Resumo</T>
        <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <T size={14} color={C.muted}>Plano</T>
          <T size={14} style={{ flex: 1, textAlign: "right" }}>{PLAN_LABEL[plan]} {period === "mensal" ? "mensal (30 dias)" : "só este evento"}</T>
        </Row>
        {period === "evento" && ev ? (
          <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <T size={14} color={C.muted}>Evento</T>
            <T size={14} numberOfLines={2} style={{ flex: 1, textAlign: "right" }}>{ev.title}</T>
          </Row>
        ) : null}
        <Row style={{ justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8 }}>
          <T size={18} weight="display">Total</T>
          <T size={18} weight="display">{formatReais(price)}</T>
        </Row>
        <MethodPicker value={choice} onChange={setChoice} />
        {err ? <ErrorBox message={err} /> : null}
        {soon ? (
          <SoonBox
            message={PAYMENT_SOON_MESSAGE}
            note={soon.requested ? "Já mandamos seu pedido pra equipe. A gente te chama rapidinho." : undefined}
            contactText={`Oi! Quero ativar o plano ${PLAN_LABEL[plan]} ${period === "mensal" ? "mensal" : `para o evento ${ev?.title ?? ""}`} no Uai Rolê.`}
          />
        ) : (
          <Button loading={busy} onPress={pay}>{`Pagar ${formatReais(price)}`}</Button>
        )}
        <Row style={{ alignItems: "flex-start" }}>
          <Icon icon={ShieldCheck} size={14} color={C.muted} />
          <T size={12} color={C.muted} style={{ flex: 1 }}>Pagamento pelo Mercado Pago: o Uai Rolê não vê nem guarda os dados do seu cartão. O plano ativa sozinho assim que o pagamento for confirmado.</T>
        </Row>
      </Card>
    </Screen>
  );
}
