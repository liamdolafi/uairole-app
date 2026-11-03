import { router, useFocusEffect } from "expo-router";
import { MapPin, Ticket } from "lucide-react-native";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { Icon } from "@/components/icons";
import { Qr } from "@/components/qr";
import { Button, Card, Empty, ErrorBox, Loading, LoginNeeded, Row, Screen, T } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { errMsg, formatWhen } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { TICKET_STATUS_LABEL, type MyTicket } from "@/lib/types";

const SELECT = "id, code, half, status, used_at, price_cents, event:events(id, title, starts_at, ends_at, venue:venues(name, neighborhood)), type:ticket_types(name)";

/** Meus ingressos: um QR code por ingresso, os próximos primeiro */
export default function IngressosScreen() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<MyTicket[] | null>(null);
  const [err, setErr] = useState("");
  const [now, setNow] = useState(0);

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from("tickets").select(SELECT).order("created_at", { ascending: false }).limit(200);
    if (error) return setErr(errMsg(error));
    setErr("");
    setNow(Date.now());
    setItems((data ?? []) as unknown as MyTicket[]);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) return <Screen padTop={false}><Loading /></Screen>;
  if (!user) return <Screen padTop={false}><LoginNeeded text="Entra na sua conta pra ver seus ingressos." /></Screen>;
  if (err) return <Screen padTop={false}><ErrorBox message={err} onRetry={load} /></Screen>;
  if (!items) return <Screen padTop={false}><Loading variant="cards" /></Screen>;

  const upcoming = items.filter((t) => t.event && new Date(t.event.ends_at).getTime() > now);
  const past = items.filter((t) => !upcoming.includes(t));
  upcoming.sort((a, b) => new Date(a.event!.starts_at).getTime() - new Date(b.event!.starts_at).getTime());

  return (
    <Screen padTop={false} onRefresh={load}>
      {items.length === 0 ? (
        <Empty icon={Ticket} title="Nenhum ingresso ainda">
          <T size={14} color={C.muted} center>Quando você comprar um ingresso pelo Uai Rolê, ele aparece aqui com o QR code.</T>
          <Button style={{ marginTop: 12 }} onPress={() => router.navigate("/")}>Achar um rolê</Button>
        </Empty>
      ) : (
        <T size={13} color={C.muted}>Mostre o QR code na entrada. Cada ingresso vale uma vez. Aumente o brilho da tela pra ler mais rápido.</T>
      )}
      {upcoming.map((t) => (
        <Card key={t.id}>
          <View style={{ gap: 2 }}>
            <T size={18} weight="display" onPress={() => router.push({ pathname: "/evento/[id]", params: { id: t.event!.id } })}>{t.event!.title}</T>
            <T size={13} color={C.muted}>{formatWhen(t.event!.starts_at, t.event!.ends_at)}</T>
            {t.event!.venue ? (
              <Row style={{ gap: 4 }}>
                <Icon icon={MapPin} size={13} color={C.muted} />
                <T size={13} color={C.muted}>{t.event!.venue.name}, {t.event!.venue.neighborhood}</T>
              </Row>
            ) : null}
          </View>
          <T size={14} weight="semibold">{t.type?.name ?? "Ingresso"}{t.half ? " · Meia-entrada (leve o documento)" : ""}</T>
          <Qr value={t.code} dim={t.status !== "valido"} />
          <T size={14} weight="semibold" center color={t.status === "valido" ? C.ok : C.danger}>
            {TICKET_STATUS_LABEL[t.status]}
            {t.status === "usado" && t.used_at ? ` em ${new Date(t.used_at).toLocaleString("pt-BR")}` : ""}
          </T>
        </Card>
      ))}
      {past.length ? (
        <Card>
          <T weight="semibold">Já rolaram ({past.length})</T>
          {past.map((t) => (
            <T key={t.id} size={13} color={C.muted}>{t.event?.title ?? "Evento"} · {t.type?.name ?? "Ingresso"} · {TICKET_STATUS_LABEL[t.status]}</T>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
