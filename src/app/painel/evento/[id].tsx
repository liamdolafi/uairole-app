import { Image } from "expo-image";
import { router, useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { Camera, Gift, Plus, Ticket } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { CATEGORY_ICON, Icon } from "@/components/icons";
import { DateTimeField } from "@/components/date-time-field";
import { Button, Card, Chip, Empty, ErrorBox, Input, Loading, Notice, Row, Screen, T } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { errMsg } from "@/lib/format";
import { cancelEventFlow } from "@/components/painel/cancel-event";
import { TicketLocked, TicketPaused, TicketPlanBadge } from "@/components/painel/ticket-plan-gate";
import { useTicketSalesStatus } from "@/lib/ticket-sales";
import { askPhotoSource, uploadPhoto, type PickedPhoto } from "@/lib/photos";
import { priceToPayload, reaisInput } from "@/lib/price-input";
import { supabase } from "@/lib/supabase";
import { C, R } from "@/lib/theme";
import { AGE_LABEL, CATEGORIES, eventPrice, planOf, TICKET_PLAN_EXPLAIN, type AgeRating, type Category, type EventRow, type Venue } from "@/lib/types";

type TicketMode = "nenhum" | "link" | "uairole";

/** Criar/editar evento (fotos, local, data, preço, idade e ingressos) */
export default function EventoForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "novo";
  const nav = useNavigation();
  const { profile } = useAuth();
  const [event, setEvent] = useState<EventRow | null | undefined>(isNew ? null : undefined);
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [f, setF] = useState({
    title: "",
    description: "",
    category: "festa" as Category,
    venue_id: "",
    starts: null as Date | null,
    ends: null as Date | null,
    free: false,
    min: "",
    max: "",
    ticketMode: "nenhum" as TicketMode,
    ticket_url: "",
    age: "livre" as AgeRating,
    cover: "" as string,
  });
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((o) => ({ ...o, [k]: v }));

  const profileId = profile?.id;
  const isAdmin = profile?.role === "admin";
  const loaded = useRef(false);
  // 030: vender pelo Uai Rolê só com Destaque ou Holofote (admin ativa o plano no site)
  const { status: sales } = useTicketSalesStatus(event?.id ?? null, !!profileId && event !== undefined, {
    eventPlan: event ? planOf(event) : undefined,
    orgPlan: profile?.organizer_plan,
  });
  const canSell = !!event?.sells_tickets || !!sales?.allowed;
  // link de ingresso próprio (031): também precisa de plano; quem já tinha link pode manter
  const canLink = !!event?.ticket_url || !!(sales?.link_allowed ?? sales?.allowed);

  // locais: recarrega sempre que volta pra esta tela (ex.: depois de cadastrar "Outro local")
  useFocusEffect(
    useCallback(() => {
      if (!profileId) return;
      let q = supabase.from("venues").select("*").order("name");
      if (!isAdmin) q = q.eq("owner_id", profileId);
      q.then(({ data }) => setVenues((data ?? []) as Venue[]));
    }, [profileId, isAdmin]),
  );

  useEffect(() => {
    nav.setOptions({ title: isNew ? "Novo evento" : "Editar evento" });
    // o evento carrega uma vez só: renovar a sessão não apaga o que a pessoa digitou
    if (!profileId || isNew || loaded.current) return;
    loaded.current = true;
    supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) return setErr(errMsg(error));
        const e = (data as EventRow) ?? null;
        setEvent(e);
        if (!e) return;
        const p = eventPrice(e);
        setF({
          title: e.title,
          description: e.description ?? "",
          category: e.category,
          venue_id: e.venue_id,
          starts: new Date(e.starts_at),
          ends: new Date(e.ends_at),
          free: p.free,
          min: reaisInput(p.min),
          max: reaisInput(p.max),
          ticketMode: e.sells_tickets ? "uairole" : e.ticket_url ? "link" : "nenhum",
          ticket_url: e.ticket_url ?? "",
          age: e.age_rating,
          cover: e.cover_url ?? "",
        });
      });
  }, [id, isNew, nav, profileId]);

  if (!profile || venues === null || event === undefined) return <Screen padTop={false}>{err ? <ErrorBox message={err} /> : <Loading />}</Screen>;
  if (!isNew && !event) return <Screen padTop={false}><Empty title="Evento não encontrado" /></Screen>;
  if (event && profile.role !== "admin" && event.organizer_id !== profile.id) return <Screen padTop={false}><Empty title="Esse evento não é seu" /></Screen>;

  const active = venues.filter((v) => !v.archived || v.id === f.venue_id);
  if (!active.length)
    return (
      <Screen padTop={false}>
        <Empty title="Cadastre um local primeiro">
          <T size={14} color={C.muted} center>Todo evento acontece num local. Cria o seu e volta aqui.</T>
          <Button style={{ marginTop: 12 }} onPress={() => router.replace({ pathname: "/painel/local/[id]", params: { id: "novo" } })}>Novo local</Button>
        </Empty>
      </Screen>
    );

  async function choosePhoto() {
    const p = await askPhotoSource();
    if (p) setPhoto(p);
  }

  async function save() {
    setErr("");
    if (f.title.trim().length < 3) return setErr("O título precisa ter pelo menos 3 letras.");
    if (!f.venue_id) return setErr("Escolhe o local.");
    if (!f.starts || !f.ends) return setErr("Coloca o início e o fim.");
    if (f.ends <= f.starts) return setErr("O fim tem que ser depois do início.");
    const price = priceToPayload({ free: f.free, min: f.min, max: f.max });
    if ("error" in price) return setErr(price.error);
    const link = f.ticketMode === "link" ? f.ticket_url.trim() : "";
    if (f.ticketMode === "link" && !/^https?:\/\//i.test(link)) return setErr("O link do ingresso precisa começar com https://");
    if (f.ticketMode === "uairole" && !canSell) return setErr(TICKET_PLAN_EXPLAIN);
    if (f.ticketMode === "link" && !canLink) return setErr(TICKET_PLAN_EXPLAIN);
    setBusy(true);
    try {
      let cover = f.cover || null;
      if (photo) cover = await uploadPhoto("covers", profile!.id, photo, 1600);
      const payload: Record<string, unknown> = {
        title: f.title.trim(),
        description: f.description.trim() || null,
        category: f.category,
        venue_id: f.venue_id,
        starts_at: f.starts.toISOString(),
        ends_at: f.ends.toISOString(),
        ...price,
        ticket_url: link || null,
        age_rating: f.age,
        cover_url: cover,
        ...(f.ticketMode === "uairole" || event?.sells_tickets !== undefined ? { sells_tickets: f.ticketMode === "uairole" } : {}),
      };
      const { data, error } = event
        ? await supabase.from("events").update(payload).eq("id", event.id).select("id").single()
        : await supabase.from("events").insert(payload).select("id").single();
      if (error) throw error;
      setBusy(false);
      // vender pelo Uai Rolê: vai direto criar os ingressos
      if (f.ticketMode === "uairole" && !event?.sells_tickets) router.replace({ pathname: "/painel/ingressos/[id]", params: { id: data.id } });
      else router.back();
    } catch (e) {
      setBusy(false);
      setErr(errMsg(e));
    }
  }

  function cancelEvent() {
    if (!event) return;
    cancelEventFlow(event.id, event.title, () => router.back(), setErr);
  }

  async function reactivate() {
    if (!event) return;
    const { error } = await supabase.from("events").update({ status: "ativo" }).eq("id", event.id);
    if (error) return setErr(errMsg(error));
    router.back();
  }

  const coverUri = photo?.uri || f.cover;
  return (
    <Screen padTop={false}>
      {event?.price_review ? <Notice>Revisa o preço desse evento: o preço antigo não deu pra converter sozinho.</Notice> : null}

      {coverUri ? (
        <Image source={{ uri: coverUri }} style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: R.lg, backgroundColor: C.surface2 }} contentFit="cover" accessibilityLabel="Foto de capa" />
      ) : null}
      <Row style={{ flexWrap: "wrap" }}>
        <Button small variant="ghost" onPress={choosePhoto} style={{ flexGrow: 1 }}>
          <Row style={{ gap: 6 }}>
            <Icon icon={Camera} size={16} />
            <T size={13} weight="semibold">{coverUri ? "Trocar foto de capa" : "Escolher foto de capa"}</T>
          </Row>
        </Button>
        {coverUri ? <Button small variant="outline" onPress={() => { setPhoto(null); set("cover", ""); }} style={{ flexGrow: 1 }}>Tirar a foto</Button> : null}
      </Row>

      <Input label="Título" maxLength={100} value={f.title} onChangeText={(v) => set("title", v)} placeholder="Ex.: Forró de Quinta" />

      <View style={{ gap: 6 }}>
        <T size={13} weight="semibold">Categoria</T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {CATEGORIES.map((c) => (
            <Chip key={c.id} icon={CATEGORY_ICON[c.id]} active={f.category === c.id} onPress={() => set("category", c.id)}>{c.label}</Chip>
          ))}
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <T size={13} weight="semibold">Local</T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {active.map((v) => (
            <Chip key={v.id} active={f.venue_id === v.id} onPress={() => set("venue_id", v.id)}>{`${v.name} (${v.neighborhood})`}</Chip>
          ))}
          <Chip icon={Plus} onPress={() => router.push({ pathname: "/painel/local/[id]", params: { id: "novo" } })}>Outro local</Chip>
        </View>
      </View>

      <DateTimeField label="Começa" value={f.starts} onChange={(d) => setF((o) => ({ ...o, starts: d, ends: o.ends ?? (d ? new Date(d.getTime() + 4 * 3600 * 1000) : null) }))} />
      <DateTimeField label="Termina" value={f.ends} onChange={(d) => set("ends", d)} />
      <T size={12} color={C.muted} style={{ marginTop: -10 }}>Horário de Brasília (BH). Pra criar um evento que repete toda semana, use o Painel no site.</T>

      <View style={{ gap: 8 }}>
        <T size={13} weight="semibold">Preço</T>
        <Pressable onPress={() => set("free", !f.free)} accessibilityRole="switch" accessibilityState={{ checked: f.free }} style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, borderRadius: R.md, borderWidth: 1, borderColor: f.free ? C.ok : C.line, backgroundColor: f.free ? `${C.ok}26` : C.surface }}>
          <Icon icon={Gift} size={18} color={f.free ? C.ok : C.ink} />
          <T weight="semibold" color={f.free ? C.ok : C.ink}>Grátis</T>
        </Pressable>
        {!f.free ? (
          <Row style={{ alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}><Input label="A partir de (R$)" keyboardType="decimal-pad" value={f.min} onChangeText={(v) => set("min", v)} placeholder="25" /></View>
            <View style={{ flex: 1 }}><Input label="Até (opcional)" keyboardType="decimal-pad" value={f.max} onChangeText={(v) => set("max", v)} placeholder="60" /></View>
          </Row>
        ) : null}
      </View>

      <View style={{ gap: 8 }}>
        <T size={13} weight="semibold">Ingresso</T>
        {(
          [
            ["nenhum", "Sem ingresso", "Entrada livre ou na porta"],
            ["link", "Já tenho link de ingresso", "Sympla, Ingresse, site próprio..."],
            ["uairole", "Vender pelo Uai Rolê", "Pix e cartão, QR code na entrada"],
          ] as const
        ).map(([m, t, sub]) => {
          const locked = f.ticketMode !== m && ((m === "uairole" && !canSell) || (m === "link" && !canLink));
          return (
            <Pressable
              key={m}
              onPress={() => (locked ? null : set("ticketMode", m))}
              accessibilityRole="radio"
              accessibilityState={{ checked: f.ticketMode === m, disabled: locked }}
              accessibilityHint={locked ? "Bloqueado no plano Grátis" : undefined}
              style={{ minHeight: 44, padding: 12, gap: 4, borderRadius: R.lg, borderWidth: 1, borderColor: f.ticketMode === m ? C.accent : C.line, backgroundColor: f.ticketMode === m ? C.accentSoft : C.surface, opacity: locked ? 0.6 : 1 }}
            >
              <T weight="semibold">{t}</T>
              {m !== "nenhum" ? <TicketPlanBadge /> : null}
              <T size={12} color={C.muted}>{locked ? "Bloqueado no plano Grátis" : sub}</T>
            </Pressable>
          );
        })}
        {(!canSell || !canLink) && sales ? <TicketLocked eventId={event?.id} /> : null}
        {event && sales?.paused ? <TicketPaused eventId={event.id} /> : event && sales?.link_paused ? <TicketPaused eventId={event.id} link /> : null}
        {f.ticketMode === "link" ? <Input label="Link do ingresso" keyboardType="url" autoCapitalize="none" value={f.ticket_url} onChangeText={(v) => set("ticket_url", v)} placeholder="https://..." /> : null}
        {f.ticketMode === "uairole" && event?.sells_tickets ? (
          <Button variant="ghost" onPress={() => router.push({ pathname: "/painel/ingressos/[id]", params: { id: event.id } })}>
            <Row>
              <Icon icon={Ticket} size={18} />
              <T weight="semibold">Tipos e lotes de ingresso</T>
            </Row>
          </Button>
        ) : f.ticketMode === "uairole" ? (
          <T size={12} color={C.muted}>Depois de salvar, você cria os tipos (Pista, VIP...) e os lotes.</T>
        ) : null}
      </View>

      <View style={{ gap: 6 }}>
        <T size={13} weight="semibold">Classificação etária</T>
        <Row>
          {(["livre", "16", "18"] as AgeRating[]).map((a) => (
            <View key={a} style={{ flex: 1 }}>
              <Chip active={f.age === a} onPress={() => set("age", a)}>{AGE_LABEL[a]}</Chip>
            </View>
          ))}
        </Row>
        <T size={12} color={C.muted}>Menores e visitantes sem login não veem eventos acima da idade deles.</T>
      </View>

      <Input label="Descrição" multiline maxLength={2000} value={f.description} onChangeText={(v) => set("description", v)} placeholder="Conta o que vai rolar!" />

      {err ? <ErrorBox message={err} /> : null}
      <Button loading={busy} onPress={save}>{isNew ? "Publicar evento" : "Salvar alterações"}</Button>
      {event ? (
        <Card style={{ gap: 8 }}>
          {event.series_id ? <T size={13} color={C.muted}>Esse evento faz parte de uma série: as mudanças valem só pra esta data.</T> : null}
          {event.status === "ativo" ? (
            <Button variant="danger" onPress={cancelEvent}>Cancelar evento</Button>
          ) : (
            <Button variant="ghost" onPress={reactivate}>Reativar evento</Button>
          )}
        </Card>
      ) : null}
    </Screen>
  );
}
