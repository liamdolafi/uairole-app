import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, Pressable, RefreshControl, ScrollView, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/components/auth-provider";
import { CheckinPanel } from "@/components/events/checkin-panel";
import { AgeBadge, Cover, FeaturedBadge, PriceLevelBadge } from "@/components/events/event-card";
import { FavoriteButton } from "@/components/events/favorite-button";
import { FriendsGoing, GoingButton } from "@/components/events/going";
import { Reviews } from "@/components/events/reviews";
import { ThermoDetail } from "@/components/events/thermo";
import { Composer } from "@/components/feed/composer";
import { PostList } from "@/components/feed/post-list";
import { Pin } from "@/components/map/pin";
import { MenuView } from "@/components/menu-view";
import { ReportSheet } from "@/components/report-sheet";
import { Button, Card, Empty, ErrorBox, LinkText, Loading, Row, T } from "@/components/ui";
import { useThermo } from "@/lib/events";
import { errMsg, formatDateLong, formatPrice, formatTime, isLive, ymd } from "@/lib/format";
import { useFriendsGoing } from "@/lib/friends";
import { useGoing } from "@/lib/going";
import { openDirections, openSite, shareLink } from "@/lib/site";
import { supabase } from "@/lib/supabase";
import { C, R } from "@/lib/theme";
import { categoryInfo, EVENT_SELECT, EVENT_SELECT_FULL, planOf, priceLevelOf, seriesLabel, type EventWithVenue } from "@/lib/types";

// conta 1 visualização por evento enquanto o app está aberto
const viewed = new Set<string>();

export default function EventoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile, loading: authLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState<EventWithVenue | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [postsKey, setPostsKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [organizer, setOrganizer] = useState<{ id: string; name: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const load = useCallback(async () => {
    setError("");
    let { data, error } = await supabase.from("events").select(EVENT_SELECT_FULL).eq("id", id).maybeSingle();
    if (error && /event_series|relationship/i.test(error.message)) ({ data, error } = await supabase.from("events").select(EVENT_SELECT).eq("id", id).maybeSingle());
    if (error) return /invalid input syntax/i.test(error.message) ? setEvent(null) : setError(errMsg(error));
    setEvent((data as EventWithVenue) ?? null);
  }, [id]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, user?.id, load]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!event || viewed.has(event.id)) return;
    viewed.add(event.id);
    supabase.rpc("register_view", { p_event: event.id }).then(() => {});
  }, [event]);

  useEffect(() => {
    if (!event?.organizer_id) return setOrganizer(null);
    supabase
      .from("public_profiles")
      .select("id,name")
      .eq("id", event.organizer_id)
      .maybeSingle()
      .then(({ data }) => setOrganizer(data ?? null));
  }, [event?.organizer_id]);

  const ids = useMemo(() => (event ? [event.id] : []), [event]);
  const thermo = useThermo(ids);
  const going = useGoing(ids);
  const friendsGoing = useFriendsGoing(ids);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshKey((k) => k + 1);
    setPostsKey((k) => k + 1);
    setRefreshing(false);
  }

  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));

  if (error || event === undefined || event === null) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top + 8, paddingHorizontal: 16 }}>
        <BackButton onPress={back} />
        {error ? (
          <ErrorBox message={error} onRetry={load} />
        ) : event === undefined ? (
          <Loading />
        ) : (
          <Empty emoji="🕵️" title="Não achamos esse rolê">
            <T size={14} color={C.muted} center>
              Ele pode ter acabado, sido removido ou não ser liberado pra sua idade{user ? "" : " (entra na sua conta pra ver mais)"}.
            </T>
            <Button onPress={() => router.replace("/")} style={{ marginTop: 14 }}>Ver outros rolês</Button>
          </Empty>
        )}
      </View>
    );
  }

  const e = event;
  const cat = categoryInfo(e.category);
  const live = e.status === "ativo" && isLive(e.starts_at, e.ends_at, now);
  const ended = new Date(e.ends_at) <= now;
  const sameDay = ymd(new Date(e.starts_at)) === ymd(new Date(e.ends_at));
  const canEdit = profile && (profile.role === "admin" || e.organizer_id === profile.id);

  function share() {
    shareLink({ title: e.title, message: `${e.title} — ${formatDateLong(e.starts_at)} em ${e.venue.name}. Bora?`, path: `/evento/${e.id}` });
  }

  function ticket() {
    supabase.rpc("track_click", { p_event: e.id, p_kind: "ticket" }).then(() => {});
    if (e.ticket_url) Linking.openURL(e.ticket_url);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.accent} colors={[C.accent]} />}
      >
        <View>
          <Cover e={e} style={{ height: 260 + insets.top, width: "100%" }} emojiSize={70} />
          <LinearGradient colors={["#00000080", "transparent", C.bg]} style={{ position: "absolute", width: "100%", height: "100%" }} />
          <View style={{ position: "absolute", top: insets.top + 8, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <BackButton onPress={back} />
            <Row>
              <FeaturedBadge plan={planOf(e)} />
              <AgeBadge r={e.age_rating} />
            </Row>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 18, marginTop: -8 }}>
          {e.status === "cancelado" ? (
            <ErrorBox message="Esse evento foi cancelado. Só você (organizador/admin) tá vendo ele." />
          ) : ended ? (
            <Card style={{ backgroundColor: C.surface2, padding: 12 }}>
              <T size={14} color={C.muted}>Esse rolê já acabou. Ainda dá pra avaliar!</T>
            </Card>
          ) : null}

          <View style={{ gap: 6 }}>
            <T size={14} weight="semibold" color={cat.color}>{cat.emoji} {cat.label}</T>
            <T size={30} weight="displayBlack" style={{ lineHeight: 34 }}>{e.title}</T>
            <Row style={{ flexWrap: "wrap" }}>
              {e.series ? <Pill>🔁 {seriesLabel(e.series)}</Pill> : null}
              {organizer ? (
                <Pressable onPress={() => router.push({ pathname: "/organizador/[id]", params: { id: organizer.id } })}>
                  <Pill>
                    por <T size={12} weight="bold">{organizer.name}</T>
                  </Pill>
                </Pressable>
              ) : null}
            </Row>
          </View>

          <View style={{ gap: 12 }}>
            <InfoRow icon="time-outline">
              <T size={14}>
                {formatDateLong(e.starts_at).replace(/^./, (c) => c.toUpperCase())} até {sameDay ? formatTime(e.ends_at) : formatDateLong(e.ends_at)}
                {live ? <T size={14} weight="bold" color={C.ok}>  ● AO VIVO</T> : null}
              </T>
            </InfoRow>
            <InfoRow icon="location-outline">
              <Pressable onPress={() => router.push({ pathname: "/local/[id]", params: { id: e.venue.id } })}>
                <T size={14} weight="bold">{e.venue.name} →</T>
                <T size={13} color={C.muted}>
                  {e.venue.address ? `${e.venue.address} · ` : ""}
                  {e.venue.neighborhood}
                </T>
              </Pressable>
            </InfoRow>
            <InfoRow icon="ticket-outline">
              <Row>
                <T size={14} weight="semibold" color={e.price_cents ? C.ink : C.ok}>{formatPrice(e.price_cents)}</T>
                <PriceLevelBadge level={priceLevelOf(e)} size={14} />
              </Row>
            </InfoRow>
          </View>

          {e.status === "ativo" && !ended ? <GoingButton eventId={e.id} endsAt={e.ends_at} going={going} size="lg" /> : null}
          <FriendsGoing friends={friendsGoing[e.id]} size={28} />

          <Row>
            <FavoriteButton eventId={e.id} />
            <Pressable onPress={share} style={{ flex: 1, height: 46, borderRadius: R.md, backgroundColor: C.surface2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Ionicons name="share-social-outline" size={18} color={C.ink} />
              <T size={14} weight="semibold">Compartilhar</T>
            </Pressable>
          </Row>
          {e.ticket_url ? <Button onPress={ticket}>🎟️ Comprar ingresso</Button> : null}
          {canEdit ? <Button variant="outline" onPress={() => openSite(`/painel/eventos/${e.id}`)}>✏️ Editar evento (no site)</Button> : null}

          {e.description ? <T size={15} style={{ lineHeight: 22 }} color={`${C.ink}e6`}>{e.description}</T> : null}

          {!ended && e.status === "ativo" ? (
            <Card>
              <T size={18} weight="display">🌡️ Termômetro</T>
              {live ? <ThermoDetail t={thermo[e.id]} /> : null}
              <CheckinPanel eventId={e.id} live={live} onDone={() => setRefreshKey((k) => k + 1)} />
            </Card>
          ) : null}

          <View style={{ gap: 10 }}>
            <T size={18} weight="display">Onde fica</T>
            <View style={{ height: 180, borderRadius: R.lg, overflow: "hidden", borderWidth: 1, borderColor: C.line }}>
              <MapView
                style={{ flex: 1 }}
                userInterfaceStyle="dark"
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                initialRegion={{ latitude: e.venue.lat, longitude: e.venue.lng, latitudeDelta: 0.008, longitudeDelta: 0.008 }}
                onPress={() => openDirections(e.venue.lat, e.venue.lng, e.venue.name, e.id)}
              >
                <Marker coordinate={{ latitude: e.venue.lat, longitude: e.venue.lng }} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
                  <Pin category={e.category} />
                </Marker>
              </MapView>
            </View>
            <Button variant="ghost" onPress={() => openDirections(e.venue.lat, e.venue.lng, e.venue.name, e.id)}>🧭 Como chegar</Button>
          </View>

          <Card>
            <Pressable onPress={() => setMenuOpen(!menuOpen)} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <T size={18} weight="display" style={{ flex: 1 }}>💲 Preços em {e.venue.name}</T>
              <Ionicons name={menuOpen ? "chevron-up" : "chevron-down"} size={18} color={C.muted} />
            </Pressable>
            {menuOpen ? <MenuView venueId={e.venue.id} /> : null}
          </Card>

          <Reviews eventId={e.id} refreshKey={refreshKey} />

          <View style={{ gap: 10 }}>
            <T size={18} weight="display">💬 Posts sobre este rolê</T>
            {user ? <Composer fixedEvent={{ id: e.id, title: e.title }} onPosted={() => setPostsKey((k) => k + 1)} placeholder="Conta como tá esse rolê..." /> : null}
            <PostList eventId={e.id} refreshKey={postsKey} empty={<T size={14} color={C.muted}>Ninguém postou sobre esse rolê ainda.</T>} />
          </View>

          <View style={{ alignItems: "center", paddingTop: 8 }}>
            <LinkText color={C.muted} onPress={() => setReportOpen(true)}>🚩 Denunciar evento</LinkText>
          </View>
        </View>
      </ScrollView>
      {reportOpen ? <ReportSheet open target={{ kind: "evento", eventId: e.id }} onClose={() => setReportOpen(false)} /> : null}
    </KeyboardAvoidingView>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel="Voltar" style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "#0009", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
      <Ionicons name="chevron-back" size={22} color={C.white} />
    </Pressable>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: C.surface2, borderRadius: R.full, paddingHorizontal: 10, paddingVertical: 5 }}>
      <T size={12}>{children}</T>
    </View>
  );
}

function InfoRow({ icon, children }: { icon: React.ComponentProps<typeof Ionicons>["name"]; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
      <Ionicons name={icon} size={19} color={C.accent} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
