import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { QrCode, Ticket } from "lucide-react-native";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { Icon } from "@/components/icons";
import { Button, Card, Empty, ErrorBox, Loading, Notice, Row, Screen, T } from "@/components/ui";
import { cancelEventFlow } from "@/components/painel/cancel-event";
import { errMsg, formatReais } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { C, R } from "@/lib/theme";
import { PAYMENT_STATUS_LABEL, type EventSales } from "@/lib/types";

/** Vendas de um evento + "Cancelar e reembolsar" */
export default function VendasScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [s, setS] = useState<EventSales | null>(null);
  const [ev, setEv] = useState<{ title: string; status: string } | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const [e, r] = await Promise.all([supabase.from("events").select("title, status").eq("id", id).maybeSingle(), supabase.rpc("event_sales", { p_event: id })]);
    if (r.error) return setErr(errMsg(r.error));
    setErr("");
    setEv(e.data ?? null);
    setS(r.data as EventSales);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function cancelAndRefund() {
    cancelEventFlow(id, ev?.title ?? "Evento", () => router.back(), setErr);
  }

  if (err && !s) return <Screen padTop={false}><ErrorBox message={err} onRetry={load} /></Screen>;
  if (!s) return <Screen padTop={false}><Loading /></Screen>;

  const box = { flex: 1, minWidth: "45%" as const, alignItems: "center" as const, padding: 12, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface };
  return (
    <Screen padTop={false} onRefresh={load}>
      <T size={20} weight="display" numberOfLines={3}>{ev?.title}</T>
      {err ? <ErrorBox message={err} /> : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <View style={box}><T size={22} weight="displayBlack" numberOfLines={1} adjustsFontSizeToFit>{s.tickets_sold}</T><T size={11} color={C.muted} center>ingressos vendidos</T></View>
        <View style={box}><T size={22} weight="displayBlack" numberOfLines={1} adjustsFontSizeToFit>{formatReais(s.gross_cents)}</T><T size={11} color={C.muted} center>vendido (na sua conta)</T></View>
        <View style={box}><T size={22} weight="displayBlack" numberOfLines={1} adjustsFontSizeToFit>{s.tickets_used}</T><T size={11} color={C.muted} center>já entraram</T></View>
        <View style={box}><T size={22} weight="displayBlack" numberOfLines={1} adjustsFontSizeToFit>{formatReais(s.refunded_cents)}</T><T size={11} color={C.muted} center>reembolsado</T></View>
      </View>
      <T size={12} color={C.muted}>A taxa de serviço ({formatReais(s.fee_cents)}) é paga por quem compra e fica com o Uai Rolê. O Mercado Pago desconta a taxa dele do valor que cai na sua conta.</T>
      <Button onPress={() => router.push({ pathname: "/painel/leitor", params: { evento: id } })}>
        <Row>
          <Icon icon={QrCode} size={18} color={C.white} />
          <T weight="semibold" color={C.white}>Ler ingressos na entrada</T>
        </Row>
      </Button>
      <Button variant="ghost" onPress={() => router.push({ pathname: "/painel/ingressos/[id]", params: { id } })}>Tipos e lotes de ingresso</Button>

      {s.by_type.length ? (
        <Card>
          <T weight="semibold">Por tipo</T>
          {s.by_type.map((t) => (
            <Row key={t.name} style={{ justifyContent: "space-between" }}>
              <T size={14} numberOfLines={1} style={{ flex: 1 }}>{t.name}</T>
              <T size={13} color={C.muted}>{t.sold} vendidos · {t.used} entraram</T>
            </Row>
          ))}
        </Card>
      ) : null}

      <T size={18} weight="display">Compras</T>
      {s.orders.length === 0 ? <Empty icon={Ticket} title="Nenhuma venda ainda" /> : null}
      {s.orders.map((o) => (
        <Card key={o.id} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <T weight="semibold" numberOfLines={1}>{o.buyer} · {o.qty} ingresso(s)</T>
            <T size={12} color={C.muted}>{o.paid_at ? new Date(o.paid_at).toLocaleString("pt-BR") : ""} · {o.method === "pix" ? "Pix" : o.method === "gratis" ? "Grátis" : "Cartão"}</T>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <T weight="semibold">{formatReais(o.subtotal_cents)}</T>
            <T size={12} color={o.status === "pago" ? C.ok : C.muted}>{PAYMENT_STATUS_LABEL[o.status]}</T>
          </View>
        </Card>
      ))}

      {ev?.status === "ativo" ? (
        <Card style={{ borderColor: `${C.danger}66` }}>
          <T weight="semibold">Cancelar o evento</T>
          <T size={13} color={C.muted}>Devolvemos o dinheiro de cada ingresso pelo Mercado Pago e avisamos quem comprou.</T>
          <Button variant="danger" onPress={cancelAndRefund}>Cancelar evento</Button>
        </Card>
      ) : (
        <Notice>Esse evento está cancelado.</Notice>
      )}
    </Screen>
  );
}
