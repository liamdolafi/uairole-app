import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/components/auth-provider";
import { AgeBadge, Cover, FeaturedBadge } from "@/components/events/event-card";
import { ThermoBar } from "@/components/events/thermo";
import { BH_REGION, Pin } from "@/components/map/pin";
import { Chip, ErrorBox, T } from "@/components/ui";
import { fetchUpcoming, matchesTime, TIME_FILTERS, useThermo, type TimeFilter } from "@/lib/events";
import { errMsg, formatPrice, formatWhen, isLive } from "@/lib/format";
import { C, R } from "@/lib/theme";
import { CATEGORIES, PLAN_RANK, planOf, PRICE_LEVELS, priceLevelOf, type Category, type EventWithVenue, type PriceLevel } from "@/lib/types";

export default function Mapa() {
  const { user, loading: authLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const map = useRef<MapView>(null);
  const [events, setEvents] = useState<EventWithVenue[] | null>(null);
  const [error, setError] = useState("");
  const [time, setTime] = useState<TimeFilter>("tudo");
  const [cat, setCat] = useState<Category | "">("");
  const [price, setPrice] = useState<PriceLevel | 0>(0);
  const [selected, setSelected] = useState<EventWithVenue | null>(null);
  const [showMe, setShowMe] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locErr, setLocErr] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setEvents(await fetchUpcoming());
    } catch (e) {
      setError(errMsg(e));
    }
  }, []);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, user?.id, load]);

  const visible = useMemo(
    () =>
      (events ?? [])
        .filter((e) => matchesTime(e, time) && (!cat || e.category === cat) && (!price || priceLevelOf(e) === price))
        // Rolê da noite por cima
        .sort((a, b) => PLAN_RANK[planOf(a)] - PLAN_RANK[planOf(b)]),
    [events, time, cat, price],
  );
  const liveIds = useMemo(() => visible.filter((e) => isLive(e.starts_at, e.ends_at)).map((e) => e.id), [visible]);
  const thermo = useThermo(liveIds);

  /** "Minha localização": usa a posição só na hora, não guarda nada */
  async function locate() {
    setLocErr("");
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        setLocErr("Você não deixou usar a localização.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setShowMe(true);
      map.current?.animateToRegion({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 600);
    } catch {
      setLocErr("Não deu pra achar sua localização.");
    } finally {
      setLocating(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <MapView
        ref={map}
        style={{ flex: 1 }}
        initialRegion={BH_REGION}
        userInterfaceStyle="dark"
        showsUserLocation={showMe}
        showsMyLocationButton={false}
        showsPointsOfInterests={false}
        toolbarEnabled={false}
        onPress={() => setSelected(null)}
      >
        {visible.map((e) => (
          <Marker
            key={e.id}
            coordinate={{ latitude: e.venue.lat, longitude: e.venue.lng }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
            onPress={(ev) => {
              ev.stopPropagation();
              setSelected(e);
            }}
          >
            <Pin category={e.category} plan={planOf(e)} />
          </Marker>
        ))}
      </MapView>

      {/* filtros em cima do mapa */}
      <View style={{ position: "absolute", top: insets.top + 8, left: 0, right: 0, gap: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}>
          {TIME_FILTERS.map((f) => (
            <Chip key={f.id} active={time === f.id} onPress={() => setTime(f.id)}>{f.label}</Chip>
          ))}
          {PRICE_LEVELS.map((p) => (
            <Chip key={p.id} active={price === p.id} onPress={() => setPrice(price === p.id ? 0 : p.id)}>{p.label}</Chip>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}>
          <Chip active={!cat} onPress={() => setCat("")}>Todas</Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c.id} active={cat === c.id} onPress={() => setCat(cat === c.id ? "" : c.id)}>{c.emoji} {c.label}</Chip>
          ))}
        </ScrollView>
        {error ? <View style={{ paddingHorizontal: 12 }}><ErrorBox message={error} onRetry={load} /></View> : null}
        {!events && !error ? <ActivityIndicator color={C.accent} /> : null}
        {events && !visible.length ? (
          <View style={{ alignSelf: "center", backgroundColor: C.surface, borderRadius: R.full, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: C.line }}>
            <T size={13} color={C.muted}>Nenhum rolê com esses filtros 🦗</T>
          </View>
        ) : null}
      </View>

      {/* minha localização */}
      <View style={{ position: "absolute", right: 12, bottom: selected ? 150 : 16, alignItems: "flex-end", gap: 8 }}>
        {locErr ? (
          <Pressable onPress={() => Linking.openSettings()} style={{ maxWidth: 230, backgroundColor: C.surface, borderRadius: R.md, padding: 10 }}>
            <T size={12} color={C.danger}>{locErr} Toque pra abrir as configurações.</T>
          </Pressable>
        ) : null}
        <Pressable
          onPress={locate}
          disabled={locating}
          style={{ flexDirection: "row", alignItems: "center", gap: 8, height: 46, paddingHorizontal: 16, borderRadius: R.full, backgroundColor: C.accent, shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 }}
        >
          {locating ? <ActivityIndicator color={C.white} size="small" /> : <Ionicons name="locate" size={18} color={C.white} />}
          <T size={14} weight="semibold" color={C.white}>Minha localização</T>
        </Pressable>
      </View>

      {/* mini-card do pino */}
      {selected ? (
        <Pressable
          onPress={() => router.push({ pathname: "/evento/[id]", params: { id: selected.id } })}
          style={{ position: "absolute", left: 12, right: 12, bottom: 12, flexDirection: "row", gap: 12, backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: planOf(selected) === "role_da_noite" ? C.accent : C.line, padding: 10 }}
        >
          <Cover e={selected} style={{ width: 92, height: 106, borderRadius: R.md }} emojiSize={30} />
          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
              <FeaturedBadge plan={planOf(selected)} />
              <AgeBadge r={selected.age_rating} />
            </View>
            <T size={15} weight="display" numberOfLines={2}>{selected.title}</T>
            <T size={12} color={C.muted} numberOfLines={1}>{formatWhen(selected.starts_at, selected.ends_at)}</T>
            <T size={12} color={C.muted} numberOfLines={1}>📍 {selected.venue.name} · {formatPrice(selected.price_cents)}</T>
            {isLive(selected.starts_at, selected.ends_at) ? <ThermoBar t={thermo[selected.id]} compact /> : null}
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.muted} style={{ alignSelf: "center" }} />
        </Pressable>
      ) : null}
    </View>
  );
}
