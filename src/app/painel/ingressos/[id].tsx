import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Pencil, Plus, Ticket, Wallet } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Icon } from "@/components/icons";
import { DateTimeField } from "@/components/date-time-field";
import { Button, Card, Empty, ErrorBox, Input, Loading, Notice, Row, Screen, Sheet, T, Toggle } from "@/components/ui";
import { errMsg, formatReais } from "@/lib/format";
import { parseReais } from "@/lib/price-input";
import { supabase } from "@/lib/supabase";
import { C, R, TOUCH } from "@/lib/theme";
import type { TicketLot, TicketType } from "@/lib/types";

const money = (c: number) => (c / 100).toFixed(2).replace(".", ",");

function TypeSheet({ eventId, type, open, onClose, onDone }: { eventId: string; type: TicketType | null; open: boolean; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ name: "", description: "", half: false, limit: "6", end: null as Date | null, active: true });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const k = type?.id ?? "novo";
  if (open && loadedFor !== k) {
    setLoadedFor(k);
    setF({
      name: type?.name ?? "",
      description: type?.description ?? "",
      half: type?.allow_half ?? false,
      limit: String(type?.per_person_limit ?? 6),
      end: type?.sales_end_at ? new Date(type.sales_end_at) : null,
      active: type?.active ?? true,
    });
    setErr("");
  }

  async function save() {
    const limit = Number(f.limit);
    if (!f.name.trim()) return setErr("Dá um nome, tipo Pista ou VIP.");
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) return setErr("Limite por pessoa entre 1 e 50.");
    setBusy(true);
    const row = { event_id: eventId, name: f.name.trim(), description: f.description.trim() || null, allow_half: f.half, per_person_limit: limit, sales_end_at: f.end?.toISOString() ?? null, active: f.active };
    const { error } = type ? await supabase.from("ticket_types").update(row).eq("id", type.id) : await supabase.from("ticket_types").insert(row);
    setBusy(false);
    if (error) return setErr(errMsg(error));
    setLoadedFor(null);
    onDone();
  }

  return (
    <Sheet open={open} onClose={() => { setLoadedFor(null); onClose(); }} title={type ? "Editar ingresso" : "Novo tipo de ingresso"}>
      <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ gap: 12 }} keyboardShouldPersistTaps="handled">
        {err ? <ErrorBox message={err} /> : null}
        <Input label="Nome" maxLength={60} value={f.name} onChangeText={(name) => setF({ ...f, name })} placeholder="Ex.: Pista, VIP, Camarote" />
        <Input label="Descrição (opcional)" maxLength={300} value={f.description} onChangeText={(description) => setF({ ...f, description })} />
        <Input label="Limite por pessoa" keyboardType="number-pad" value={f.limit} onChangeText={(limit) => setF({ ...f, limit })} />
        <DateTimeField label="Fim das vendas (opcional)" optional value={f.end} onChange={(end) => setF({ ...f, end })} />
        <Toggle on={f.half} onChange={(half) => setF({ ...f, half })} label="Tem meia-entrada" hint="Metade do preço. O documento é conferido na entrada." />
        {type ? <Toggle on={f.active} onChange={(active) => setF({ ...f, active })} label="À venda" /> : null}
        <Button loading={busy} onPress={save}>Salvar</Button>
      </ScrollView>
    </Sheet>
  );
}

function LotSheet({ typeId, lot, nextSort, open, onClose, onDone }: { typeId: string; lot: TicketLot | null; nextSort: number; open: boolean; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ name: "", price: "", qty: "100", end: null as Date | null });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const k = `${typeId}:${lot?.id ?? "novo"}`;
  if (open && loadedFor !== k) {
    setLoadedFor(k);
    setF({ name: lot?.name ?? `${nextSort + 1}º lote`, price: lot ? money(lot.price_cents) : "", qty: String(lot?.quantity ?? 100), end: lot?.ends_at ? new Date(lot.ends_at) : null });
    setErr("");
  }

  async function save() {
    const price = parseReais(f.price || "0");
    const qty = Number(f.qty);
    if (price === null || Number.isNaN(price)) return setErr("Preço inválido.");
    if (!Number.isInteger(qty) || qty < 1) return setErr("Quantidade inválida.");
    setBusy(true);
    const row = { type_id: typeId, name: f.name.trim() || "Lote", price_cents: price, quantity: qty, ends_at: f.end?.toISOString() ?? null, sort: lot?.sort ?? nextSort };
    const { error } = lot ? await supabase.from("ticket_lots").update(row).eq("id", lot.id) : await supabase.from("ticket_lots").insert(row);
    setBusy(false);
    if (error) return setErr(errMsg(error));
    setLoadedFor(null);
    onDone();
  }

  function remove() {
    if (!lot) return;
    Alert.alert(`Apagar o ${lot.name}?`, undefined, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Apagar",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("ticket_lots").delete().eq("id", lot.id);
          if (error) return setErr(errMsg(error));
          setLoadedFor(null);
          onDone();
        },
      },
    ]);
  }

  return (
    <Sheet open={open} onClose={() => { setLoadedFor(null); onClose(); }} title={lot ? "Editar lote" : "Novo lote"}>
      <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ gap: 12 }} keyboardShouldPersistTaps="handled">
        {err ? <ErrorBox message={err} /> : null}
        <Input label="Lote" maxLength={40} value={f.name} onChangeText={(name) => setF({ ...f, name })} />
        <Row style={{ alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}><Input label="Preço (R$)" keyboardType="decimal-pad" value={f.price} onChangeText={(price) => setF({ ...f, price })} placeholder="0 = grátis" /></View>
          <View style={{ flex: 1 }}><Input label="Quantidade" keyboardType="number-pad" value={f.qty} onChangeText={(qty) => setF({ ...f, qty })} /></View>
        </Row>
        <DateTimeField label="Vira em (opcional)" optional value={f.end} onChange={(end) => setF({ ...f, end })} />
        <T size={12} color={C.muted}>O lote seguinte entra quando este esgota ou chega a data de virada.</T>
        <Button loading={busy} onPress={save}>Salvar lote</Button>
        {lot ? <Button variant="danger" onPress={remove}>Apagar lote</Button> : null}
      </ScrollView>
    </Sheet>
  );
}

/** Ingressos vendidos pelo Uai Rolê: tipos (Pista, VIP...) e lotes */
export default function IngressosManager() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [types, setTypes] = useState<TicketType[] | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [err, setErr] = useState("");
  const [typeSheet, setTypeSheet] = useState<{ open: boolean; type: TicketType | null }>({ open: false, type: null });
  const [lotSheet, setLotSheet] = useState<{ open: boolean; typeId: string; lot: TicketLot | null; next: number }>({ open: false, typeId: "", lot: null, next: 0 });

  const load = useCallback(async () => {
    const [t, a] = await Promise.all([
      supabase.from("ticket_types").select("*, lots:ticket_lots(*)").eq("event_id", id).order("sort").order("created_at"),
      supabase.rpc("my_mp_account"),
    ]);
    if (t.error) return setErr(errMsg(t.error));
    setConnected(Boolean(a.data));
    setTypes(((t.data ?? []) as TicketType[]).map((x) => ({ ...x, lots: (x.lots ?? []).sort((p, q) => p.sort - q.sort) })));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const done = () => {
    setTypeSheet({ open: false, type: null });
    setLotSheet((s) => ({ ...s, open: false }));
    load();
  };

  return (
    <Screen padTop={false} onRefresh={load}>
      {err ? <ErrorBox message={err} onRetry={load} /> : null}
      {connected === false ? (
        <Notice>
          <T size={14}>Pra vender, conecte sua conta do Mercado Pago (o dinheiro cai direto nela).</T>
          <Button small variant="ghost" onPress={() => router.push("/painel/mercado-pago")}>
            <Row>
              <Icon icon={Wallet} size={16} />
              <T size={13} weight="semibold">Conectar Mercado Pago</T>
            </Row>
          </Button>
        </Notice>
      ) : null}
      {!types ? <Loading /> : types.length === 0 ? <Empty icon={Ticket} title="Nenhum ingresso ainda">Crie o primeiro tipo (ex.: Pista) e depois os lotes com preço.</Empty> : null}
      {types?.map((t) => (
        <Card key={t.id} style={{ opacity: t.active ? 1 : 0.6 }}>
          <Row style={{ justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <T weight="semibold">{t.name}{t.active ? "" : " (fora de venda)"}</T>
              <T size={12} color={C.muted}>
                Até {t.per_person_limit} por pessoa{t.allow_half ? " · tem meia" : ""}
                {t.sales_end_at ? ` · vendas até ${new Date(t.sales_end_at).toLocaleString("pt-BR")}` : ""}
              </T>
            </View>
            <Pressable onPress={() => setTypeSheet({ open: true, type: t })} accessibilityRole="button" accessibilityLabel={`Editar ${t.name}`} style={{ width: TOUCH, height: TOUCH, borderRadius: R.md, backgroundColor: C.surface2, alignItems: "center", justifyContent: "center" }}>
              <Icon icon={Pencil} size={16} />
            </Pressable>
          </Row>
          {t.lots?.map((l) => (
            <Pressable key={l.id} onPress={() => setLotSheet({ open: true, typeId: t.id, lot: l, next: l.sort })} accessibilityRole="button" style={{ minHeight: TOUCH, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, borderRadius: R.md, backgroundColor: C.surface2 }}>
              <T size={13} style={{ flex: 1 }}>{l.name} · {l.quantity} un.{l.ends_at ? ` · vira ${new Date(l.ends_at).toLocaleDateString("pt-BR")}` : ""}</T>
              <T size={14} weight="semibold">{l.price_cents ? formatReais(l.price_cents) : "Grátis"}</T>
            </Pressable>
          ))}
          <Button small variant="ghost" onPress={() => setLotSheet({ open: true, typeId: t.id, lot: null, next: t.lots?.length ?? 0 })}>
            <Row style={{ gap: 6 }}>
              <Icon icon={Plus} size={16} />
              <T size={13} weight="semibold">Adicionar lote</T>
            </Row>
          </Button>
        </Card>
      ))}
      <Button variant="ghost" onPress={() => setTypeSheet({ open: true, type: null })}>
        <Row>
          <Icon icon={Plus} size={18} />
          <T weight="semibold">Novo tipo de ingresso</T>
        </Row>
      </Button>
      <T size={12} color={C.muted}>Quem compra paga a taxa de serviço do Uai Rolê por cima do preço. Menores não compram ingresso de evento 16+ ou 18+.</T>
      <Button variant="outline" onPress={() => router.push({ pathname: "/painel/vendas/[id]", params: { id } })}>Ver vendas</Button>

      <TypeSheet eventId={id} type={typeSheet.type} open={typeSheet.open} onClose={() => setTypeSheet({ open: false, type: null })} onDone={done} />
      <LotSheet typeId={lotSheet.typeId} lot={lotSheet.lot} nextSort={lotSheet.next} open={lotSheet.open} onClose={() => setLotSheet((s) => ({ ...s, open: false }))} onDone={done} />
    </Screen>
  );
}
