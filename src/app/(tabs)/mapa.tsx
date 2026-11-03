import { router } from "expo-router";
import { ChevronRight, LocateFixed } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/components/auth-provider";
import { AgeBadge, Cover, FeaturedBadge, Place } from "@/components/events/event-card";
import { ThermoBar } from "@/components/events/thermo";
import { FilterSheet, FiltersButton } from "@/components/filters/filter-sheet";
import { Icon } from "@/components/icons";
import { BH_REGION, ClusterPin, Pin } from "@/components/map/pin";
import { Chip, ErrorBox, T } from "@/components/ui";
import { fetchUpcoming, useThermo } from "@/lib/events";
import { applyFilters, countActive, WHEN_OPTIONS } from "@/lib/filters";
import { errMsg, formatWhen, isLive } from "@/lib/format";
import { C, R, TOUCH } from "@/lib/theme";
import { PLAN_RANK, planOf, priceLabel, type EventWithVenue } from "@/lib/types";
import { locateNow, useFilters, useHere } from "@/lib/use-filters";

type Group = { key: string; lat: number; lng: number; items: EventWithVenue[] };

/** Junta pinos que ficariam a menos de ~52 px um do outro na tela; abre ao dar zoom */
function clusterize(events: EventWithVenue[], region: Region, width: number): Group[] {
  const pxPerLng = width / region.longitudeDelta;
  const pxPerLat = pxPerLng; // perto do equador a diferença é pequena
  const zoomedIn = region.longitudeDelta < 0.004;
  const groups: Group[] = [];
  // Holofote primeiro, pra virar o centro do grupo
  const sorted = [...events].sort((a, b) => PLAN_RANK[planOf(b)] - PLAN_RANK[planOf(a)]);
  for (const e of sorted) {
    if (!e.venue) continue;
    const g = zoomedIn
      ? undefined
      : groups.find((c) => Math.hypot((c.lng - e.venue.lng) * pxPerLng, (c.lat - e.venue.lat) * pxPerLat) < 52);
    if (g) g.items.push(e);
    else groups.push({ key: e.id, lat: e.venue.lat, lng: e.venue.lng, items: [e] });
  }
  // eventos no mesmo local (zoom máximo) ficam levemente espalhados
  const seen = new Map<string, number>();
  return groups.map((g) => {
    if (g.items.length > 1) return g;
    const e = g.items[0];
    const n = seen.get(e.venue_id) ?? 0;
    seen.set(e.venue_id, n + 1);
    const r = n ? 0.00025 * Math.sqrt(n) : 0;
    return { ...g, lat: g.lat + r * Math.cos(n * 2.4), lng: g.lng + r * Math.sin(n * 2.4) };
  });
}

export default function Mapa() {
  const { user, loading: authLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const map = useRef<MapView>(null);
  const [events, setEvents] = useState<EventWithVenue[] | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<EventWithVenue | null>(null);
  const [region, setRegion] = useState<Region>(BH_REGION);
  const [sheet, setSheet] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locErr, setLocErr] = useState("");
  const { filters, setFilters, clear } = useFilters();
  const here = useHere();

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

  const liveIds = useMemo(() => (events ?? []).filter((e) => isLive(e.starts_at, e.ends_at)).map((e) => e.id), [events]);
  const thermo = useThermo(liveIds);
  const visible = useMemo(() => (events ? applyFilters(events, filters, { pos: here, thermo }) : []), [events, filters, here, thermo]);
  const groups = useMemo(() => clusterize(visible, region, width), [visible, region, width]);
  const hoods = useMemo(
    () => [...new Set((events ?? []).map((e) => e.venue?.neighborhood).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [events],
  );

  /** "Minha localização": usa a posição só na hora, não guarda nada */
  async function locate() {
    setLocErr("");
    setLocating(true);
    try {
      const p = await locateNow();
      if (p) map.current?.animateToRegion({ latitude: p.lat, longitude: p.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 600);
    } catch (e) {
      setLocErr((e as Error).message);
    } finally {
      setLocating(false);
    }
  }

  function openGroup(g: Group) {
    const lats = g.items.map((e) => e.venue.lat);
    const lngs = g.items.map((e) => e.venue.lng);
    const dLat = Math.max(...lats) - Math.min(...lats);
    const dLng = Math.max(...lngs) - Math.min(...lngs);
    const delta = Math.max(Math.min(region.longitudeDelta / 3, Math.max(dLat, dLng) * 2.2), 0.002);
    map.current?.animateToRegion({ latitude: (Math.max(...lats) + Math.min(...lats)) / 2, longitude: (Math.max(...lngs) + Math.min(...lngs)) / 2, latitudeDelta: delta, longitudeDelta: delta }, 450);
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <MapView
        ref={map}
        style={{ flex: 1 }}
        initialRegion={BH_REGION}
        userInterfaceStyle="dark"
        showsUserLocation={!!here}
        showsMyLocationButton={false}
        showsPointsOfInterests={false}
        toolbarEnabled={false}
        onRegionChangeComplete={setRegion}
        onPress={() => setSelected(null)}
      >
        {groups.map((g) =>
          g.items.length > 1 ? (
            <Marker
              key={`g-${g.items.map((e) => e.id).join(",")}`}
              coordinate={{ latitude: g.lat, longitude: g.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              accessibilityLabel={`${g.items.length} rolês aqui perto. Toque pra abrir.`}
              onPress={(ev) => {
                ev.stopPropagation();
                openGroup(g);
              }}
            >
              <ClusterPin count={g.items.length} hot={g.items.some((e) => planOf(e) === "holofote")} />
            </Marker>
          ) : (
            <Marker
              key={g.key}
              coordinate={{ latitude: g.lat, longitude: g.lng }}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={false}
              accessibilityLabel={g.items[0].title}
              zIndex={PLAN_RANK[planOf(g.items[0])]}
              onPress={(ev) => {
                ev.stopPropagation();
                setSelected(g.items[0]);
              }}
            >
              <Pin category={g.items[0].category} plan={planOf(g.items[0])} />
            </Marker>
          ),
        )}
      </MapView>

      {/* filtros em cima do mapa */}
      <View style={{ position: "absolute", top: insets.top + 8, left: 0, right: 0, gap: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}>
          <FiltersButton onPress={() => setSheet(true)} />
          {WHEN_OPTIONS.filter((o) => o.id !== "datas").map((o) => (
            <Chip key={o.id} active={filters.when === o.id} onPress={() => setFilters((f) => ({ ...f, when: o.id }))}>
              {o.label}
            </Chip>
          ))}
        </ScrollView>
        {error ? (
          <View style={{ paddingHorizontal: 12 }}>
            <ErrorBox message={error} onRetry={load} />
          </View>
        ) : null}
        {!events && !error ? <ActivityIndicator color={C.accent} /> : null}
        {events && !visible.length ? (
          <View style={{ alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.surface, borderRadius: R.full, paddingLeft: 14, borderWidth: 1, borderColor: C.line }}>
            <T size={13} color={C.muted}>Nenhum rolê com esses filtros.</T>
            {countActive(filters) ? (
              <Pressable onPress={clear} accessibilityRole="button" style={{ minHeight: TOUCH, justifyContent: "center", paddingRight: 14 }}>
                <T size={13} weight="semibold" color={C.accent}>Limpar filtros</T>
              </Pressable>
            ) : (
              <View style={{ width: 4, height: TOUCH }} />
            )}
          </View>
        ) : null}
      </View>

      {/* minha localização */}
      <View style={{ position: "absolute", right: 12, bottom: selected ? 150 : 16, alignItems: "flex-end", gap: 8 }}>
        {locErr ? (
          <Pressable onPress={() => Linking.openSettings()} style={{ maxWidth: 240, backgroundColor: C.surface, borderRadius: R.md, padding: 10 }}>
            <T size={12} color={C.danger}>{locErr} Toque pra abrir os Ajustes.</T>
          </Pressable>
        ) : null}
        <Pressable
          onPress={locate}
          disabled={locating}
          accessibilityRole="button"
          accessibilityLabel="Ir pra minha localização"
          style={{ flexDirection: "row", alignItems: "center", gap: 8, height: 48, paddingHorizontal: 16, borderRadius: R.full, backgroundColor: C.accentStrong, shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 }}
        >
          {locating ? <ActivityIndicator color={C.white} size="small" /> : <Icon icon={LocateFixed} size={18} color={C.white} />}
          <T size={14} weight="semibold" color={C.white}>Minha localização</T>
        </Pressable>
      </View>

      {/* mini-card do pino */}
      {selected ? (
        <Pressable
          onPress={() => router.push({ pathname: "/evento/[id]", params: { id: selected.id } })}
          accessibilityRole="button"
          accessibilityLabel={`Ver ${selected.title}`}
          style={{ position: "absolute", left: 12, right: 12, bottom: 12, flexDirection: "row", gap: 12, backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: planOf(selected) === "holofote" ? C.accent : C.line, padding: 10 }}
        >
          <Cover e={selected} style={{ width: 92, height: 106, borderRadius: R.md }} artSize={70} />
          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
              <FeaturedBadge plan={planOf(selected)} />
              <AgeBadge r={selected.age_rating} />
            </View>
            <T size={15} weight="display" numberOfLines={2}>{selected.title}</T>
            <T size={12} color={C.muted} numberOfLines={1}>{formatWhen(selected.starts_at, selected.ends_at)}</T>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Place e={selected} full={false} size={12} />
              <T size={12} color={C.muted}>· {priceLabel(selected)}</T>
            </View>
            {isLive(selected.starts_at, selected.ends_at) ? <ThermoBar t={thermo[selected.id]} compact /> : null}
          </View>
          <View style={{ alignSelf: "center" }}>
            <Icon icon={ChevronRight} size={18} color={C.muted} />
          </View>
        </Pressable>
      ) : null}

      <FilterSheet open={sheet} onClose={() => setSheet(false)} hoods={hoods} resultCount={visible.length} />
    </View>
  );
}
