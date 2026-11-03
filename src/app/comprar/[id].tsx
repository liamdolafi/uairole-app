import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { Minus, Plus, ShieldCheck, Ticket } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { Icon } from "@/components/icons";
import { MethodPicker } from "@/components/method-picker";
import { Button, Card, Empty, ErrorBox, LinkText, Loading, LoginNeeded, Notice, Row, Screen, T } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { formatReais, formatWhen } from "@/lib/format";
import { choiceToBody, startPayment } from "@/lib/payments";
import { openSite } from "@/lib/site";
import { supabase } from "@/lib/supabase";
import { C, R, TOUCH } from "@/lib/theme";
import { AGE_LABEL, EVENT_SELECT, serviceFee, ticketUnitPrice, type EventWithVenue, type PayChoice, type TicketAvailability } from "@/lib/types";

const key = (typeId: string, half: boolean) => `${typeId}:${half ? 1 : 0}`;

function Stepper({ value, onChange, max, label }: { value: number; onChange: (n: number) => void; max: number; label: string }) {
  const btn = (disabled: boolean) => ({ width: TOUCH, height: TOUCH, borderRadius: R.md, backgroundColor: C.surface2, alignItems: "center" as const, justifyContent: "center" as const, opacity: disabled ? 0.4 : 1 });
  return (
    <Row style={{ gap: 4 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Menos ${label}`} disabled={value === 0} onPress={() => onChange(Math.max(0, value - 1))} style={btn(value === 0)}>
        <Icon icon={Minus} size={18} />
      </Pressable>
      <T size={18} weight="display" style={{ width: 30, textAlign: "center" }} accessibilityLiveRegion="polite">{value}</T>
      <Pressable accessibilityRole="button" accessibilityLabel={`Mais ${label}`} disabled={value >= max} onPress={() => { Haptics.selectionAsync().catch(() => {}); onChange(Math.min(max, value + 1)); }} style={btn(value >= max)}>
        <Icon icon={Plus} size={18} />
      </Pressable>
    </Row>
  );
}

/** Compra de ingresso: tipo, quantidade, total com a taxa de serviço e pagamento */
export default function ComprarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, loading } = useAuth();
  const [event, setEvent] = useState<EventWithVenue | null | undefined>(undefined);
  const [av, setAv] = useState<TicketAvailability | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [method, setMethod] = useState<PayChoice>("pix");
  const [soon, setSoon] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const [e, a] = await Promise.all([
      supabase.from("events").select(EVENT_SELECT).eq("id", id).maybeSingle(),
      supabase.rpc("ticket_availability", { p_event: id }),
    ]);
    setEvent((e.data as EventWithVenue) ?? null);
    setAv((a.data as TicketAvailability) ?? { sells: false });
  }, [id]);

  useEffect(() => {
    load();
  }, [load, user]);

  const types = useMemo(() => av?.types ?? [], [av]);
  const rate = av?.fee_rate ?? 0.08;
  const subtotal = types.reduce(
    (s, t) => s + (t.lot ? (qty[key(t.id, false)] ?? 0) * t.lot.price_cents + (qty[key(t.id, true)] ?? 0) * ticketUnitPrice(t.lot.price_cents, true) : 0),
    0,
  );
  const fee = serviceFee(subtotal, rate);
  const count = Object.values(qty).reduce((a, b) => a + b, 0);
  const anyHalf = Object.entries(qty).some(([k, n]) => k.endsWith(":1") && n > 0);

  if (loading || event === undefined || !av) return <Screen padTop={false}><Loading /></Screen>;
  if (!event) return <Screen padTop={false}><Empty title="Evento não encontrado">Pode ser que ele seja pra uma idade acima da sua.</Empty></Screen>;

  async function pay() {
    setErr("");
    const items = Object.entries(qty)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => ({ type_id: k.split(":")[0], qty: n, half: k.endsWith(":1") }));
    if (!items.length) return setErr("Escolha pelo menos um ingresso.");
    setBusy(true);
    const e = await startPayment({ kind: "ingresso", eventId: id, items, ...choiceToBody(method) });
    setBusy(false);
    if (e?.notConfigured) setSoon(true);
    else if (e) setErr(e.error);
    else load();
  }

  return (
    <Screen padTop={false} onRefresh={load}>
      <View style={{ gap: 2 }}>
        <T size={24} weight="displayBlack">{event.title}</T>
        <T size={14} color={C.muted}>
          {formatWhen(event.starts_at, event.ends_at)}
          {event.venue ? ` · ${event.venue.name}` : ""} · {AGE_LABEL[event.age_rating]}
        </T>
      </View>

      {!user ? (
        <LoginNeeded text="Entra na sua conta pra comprar. O ingresso fica guardado em Meus ingressos." />
      ) : !av.sells || !av.open ? (
        <Empty icon={Ticket} title="Vendas fechadas">Esse evento não está vendendo ingressos pelo Uai Rolê agora.</Empty>
      ) : !av.connected ? (
        <Notice>As vendas desse evento ainda não estão liberadas. Tenta de novo mais tarde.</Notice>
      ) : (
        <>
          {types.length === 0 ? <Empty icon={Ticket} title="Nenhum ingresso à venda ainda" /> : null}
          {types.map((t) => {
            const lot = t.lot;
            const soldOut = !lot || !t.on_sale;
            const chosen = (qty[key(t.id, false)] ?? 0) + (qty[key(t.id, true)] ?? 0);
            const max = lot ? Math.min(t.per_person_limit, lot.remaining) : 0;
            return (
              <Card key={t.id} style={soldOut ? { opacity: 0.6 } : undefined}>
                <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T weight="semibold">{t.name}</T>
                    {t.description ? <T size={12} color={C.muted}>{t.description}</T> : null}
                    <T size={12} color={C.muted}>
                      {soldOut ? (t.on_sale ? "Esgotado" : "Vendas encerradas") : `${lot!.name}${lot!.remaining <= 20 ? ` · restam ${lot!.remaining}` : ""}`}
                    </T>
                  </View>
                  {lot ? <T size={18} weight="display" style={{ flexShrink: 0, maxWidth: "45%" }} numberOfLines={1} adjustsFontSizeToFit>{formatReais(lot.price_cents)}</T> : null}
                </Row>
                {!soldOut ? (
                  <>
                    <Row style={{ justifyContent: "space-between" }}>
                      <T size={14}>Inteira</T>
                      <Stepper label={`${t.name} inteira`} value={qty[key(t.id, false)] ?? 0} max={(qty[key(t.id, false)] ?? 0) + max - chosen} onChange={(n) => setQty((o) => ({ ...o, [key(t.id, false)]: n }))} />
                    </Row>
                    {t.allow_half ? (
                      <Row style={{ justifyContent: "space-between" }}>
                        <T size={14} style={{ flex: 1 }}>Meia · {formatReais(ticketUnitPrice(lot!.price_cents, true))}</T>
                        <Stepper label={`${t.name} meia`} value={qty[key(t.id, true)] ?? 0} max={(qty[key(t.id, true)] ?? 0) + max - chosen} onChange={(n) => setQty((o) => ({ ...o, [key(t.id, true)]: n }))} />
                      </Row>
                    ) : null}
                    <T size={12} color={C.muted}>Até {t.per_person_limit} por pessoa.</T>
                  </>
                ) : null}
              </Card>
            );
          })}

          {anyHalf ? <Notice>Meia-entrada: o documento que dá direito à meia (carteirinha de estudante, ID Jovem etc.) é conferido na entrada.</Notice> : null}

          {count > 0 ? (
            <Card>
              <Row style={{ justifyContent: "space-between" }}>
                <T size={14} color={C.muted}>Ingressos ({count})</T>
                <T size={14}>{formatReais(subtotal)}</T>
              </Row>
              <Row style={{ justifyContent: "space-between" }}>
                <T size={14} color={C.muted}>Taxa de serviço ({Math.round(rate * 1000) / 10}%)</T>
                <T size={14}>{formatReais(fee)}</T>
              </Row>
              <Row style={{ justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8 }}>
                <T size={18} weight="display">Total</T>
                <T size={18} weight="display">{formatReais(subtotal + fee)}</T>
              </Row>
              {subtotal > 0 ? <MethodPicker value={method} onChange={setMethod} /> : null}
              {err ? <ErrorBox message={err} /> : null}
              {soon ? <Notice>A compra online de ingressos chega em breve. Por enquanto, fale com o organizador do evento.</Notice> : null}
              <Button loading={busy} disabled={soon} onPress={pay}>{subtotal > 0 ? `Pagar ${formatReais(subtotal + fee)}` : "Garantir ingresso grátis"}</Button>
              <Row style={{ alignItems: "flex-start" }}>
                <Icon icon={ShieldCheck} size={14} color={C.muted} />
                <T size={12} color={C.muted} style={{ flex: 1 }}>
                  Pagamento pelo Mercado Pago: o Uai Rolê não vê nem guarda os dados do seu cartão. Regras de compra e reembolso nos{" "}
                  <LinkText size={12} onPress={() => openSite("/termos#ingressos")}>Termos de Uso (abre o site)</LinkText>.
                </T>
              </Row>
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}
