import { router } from "expo-router";
import { Flame, Lightbulb, Search, SearchX, TrendingUp, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/components/auth-provider";
import { EventCard, HotCard, SpotlightCard, TrendingCard } from "@/components/events/event-card";
import { CardFooter } from "@/components/events/going";
import { FilterSheet, FiltersButton } from "@/components/filters/filter-sheet";
import { HolofoteIcon, Icon } from "@/components/icons";
import { Button, CardsSkeleton, Empty, ErrorBox, LinkText, Row, Skeleton, T } from "@/components/ui";
import { fetchTrending, fetchUpcoming, pickTrending, useThermo } from "@/lib/events";
import { applyFilters, countActive, distanceKm, formatKm, SORT_OPTIONS, spotlightEvents } from "@/lib/filters";
import { errMsg, isLive } from "@/lib/format";
import { useFriendsGoing } from "@/lib/friends";
import { useGoing } from "@/lib/going";
import { C, F, R, TOUCH } from "@/lib/theme";
import type { EventWithVenue, TrendingRow } from "@/lib/types";
import { useFilters, useHere } from "@/lib/use-filters";

export default function Descobrir() {
  const { user, loading: authLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<EventWithVenue[] | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState("");
  const [sheet, setSheet] = useState(false);
  const { filters, clear } = useFilters();
  const here = useHere();

  const [trendRows, setTrendRows] = useState<TrendingRow[] | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const [list, trend] = await Promise.all([fetchUpcoming(), fetchTrending(10)]);
      setTrendRows(trend);
      setEvents(list);
    } catch (e) {
      setError(errMsg(e));
    }
  }, []);

  // recarrega quando o login muda (a lista depende da idade)
  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, user?.id, load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const liveIds = useMemo(() => (events ?? []).filter((e) => isLive(e.starts_at, e.ends_at)).map((e) => e.id), [events]);
  const thermo = useThermo(liveIds);
  const allIds = useMemo(() => (events ?? []).map((e) => e.id), [events]);
  const going = useGoing(allIds);
  const friendsGoing = useFriendsGoing(allIds);

  const hoods = useMemo(
    () => [...new Set((events ?? []).map((e) => e.venue?.neighborhood).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [events],
  );

  const hot = useMemo(
    () =>
      (events ?? [])
        .filter((e) => isLive(e.starts_at, e.ends_at))
        .sort((a, b) => (thermo[b.id]?.score ?? -1) - (thermo[a.id]?.score ?? -1))
        .slice(0, 8),
    [events, thermo],
  );

  const filtered = useMemo(() => (events ? applyFilters(events, filters, { pos: here, thermo, q }) : []), [events, filters, here, thermo, q]);
  const active = countActive(filters);
  const hasFilters = active > 0 || !!q.trim();
  const spot = useMemo(() => (events ? spotlightEvents(events).slice(0, 10) : []), [events]);
  const trendHot = useMemo(() => new Set((trendRows ?? []).filter((r) => !r.filler).map((r) => r.event_id)), [trendRows]);
  const trending = useMemo(() => (events ? pickTrending(events, trendRows, 10) : []), [events, trendRows]);
  const sortLabel = SORT_OPTIONS.find((o) => o.id === filters.sort)?.label;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 40, gap: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.accent} colors={[C.accent]} />}
      >
        <View style={{ gap: 4 }}>
          <T size={30} weight="displayBlack" style={{ lineHeight: 34 }} accessibilityRole="header">
            Qual é o rolê <T size={30} weight="displayBlack" color={C.accent}>hoje</T>, sô?
          </T>
          <T size={14} color={C.muted}>Festas, shows, peladas e muito mais em BH.</T>
          {user ? (
            <Button variant="ghost" small style={{ alignSelf: "flex-start", marginTop: 8 }} onPress={() => router.push("/sugerir")}>
              <Icon icon={Lightbulb} size={16} color={C.ink} />
              <T size={13} weight="semibold">Sugerir um evento</T>
            </Button>
          ) : null}
        </View>

        <Row>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, height: TOUCH + 2, borderRadius: R.md, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, paddingLeft: 12 }}>
            <Icon icon={Search} size={18} color={C.muted} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Buscar rolê, local ou bairro"
              placeholderTextColor={C.muted}
              selectionColor={C.accent}
              returnKeyType="search"
              accessibilityLabel="Buscar rolê, local ou bairro"
              style={{ flex: 1, color: C.ink, fontFamily: F.regular, fontSize: 15, height: "100%" }}
            />
            {q ? (
              <Pressable onPress={() => setQ("")} accessibilityLabel="Limpar busca" style={{ width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center" }}>
                <Icon icon={X} size={18} color={C.muted} />
              </Pressable>
            ) : null}
          </View>
          <FiltersButton onPress={() => setSheet(true)} />
        </Row>

        {error ? <ErrorBox message={error} onRetry={load} /> : null}
        {!events && !error ? (
          <View style={{ gap: 20 }}>
            <Row style={{ gap: 12, overflow: "hidden" }}>
              <Skeleton style={{ width: 280, height: 220, borderRadius: R.xl }} />
              <Skeleton style={{ width: 280, height: 220, borderRadius: R.xl }} />
            </Row>
            <CardsSkeleton />
          </View>
        ) : null}

        {events ? (
          <>
            {spot.length && !hasFilters ? (
              <View style={{ gap: 10 }}>
                <Row>
                  <HolofoteIcon size={20} color={C.accent} />
                  <T size={18} weight="display" accessibilityRole="header">Em destaque</T>
                </Row>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }} snapToInterval={292} decelerationRate="fast">
                  {spot.map((e) => (
                    <SpotlightCard key={e.id} e={e} />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {trending.length && !hasFilters ? (
              <View style={{ gap: 10 }}>
                <Row>
                  <Icon icon={TrendingUp} size={20} color={C.accent} />
                  <T size={18} weight="display" accessibilityRole="header">Em alta esta semana</T>
                </Row>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
                  {trending.map((e, i) => (
                    <TrendingCard key={e.id} e={e} rank={trendHot.has(e.id) ? i + 1 : undefined} />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {hot.length && !hasFilters ? (
              <View style={{ gap: 10 }}>
                <Row>
                  <Icon icon={Flame} size={20} color={C.warn} />
                  <T size={18} weight="display" accessibilityRole="header">Bombando agora</T>
                </Row>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
                  {hot.map((e) => (
                    <HotCard key={e.id} e={e} thermo={thermo[e.id]} />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View style={{ gap: 14 }}>
              <Row style={{ justifyContent: "space-between", minHeight: TOUCH }}>
                <T size={13} color={C.muted}>
                  {filtered.length === 1 ? "1 rolê" : `${filtered.length} rolês`} · {sortLabel}
                </T>
                {active ? (
                  <Pressable onPress={clear} accessibilityRole="button" style={{ minHeight: TOUCH, justifyContent: "center", paddingLeft: 12 }}>
                    <T size={13} weight="semibold" color={C.accent}>Limpar filtros</T>
                  </Pressable>
                ) : null}
              </Row>
              {filtered.length ? (
                filtered.map((e) => (
                  <EventCard
                    key={e.id}
                    e={e}
                    thermo={thermo[e.id]}
                    distance={here && e.venue ? formatKm(distanceKm(here, e.venue)) : undefined}
                    footer={<CardFooter e={e} going={going} friends={friendsGoing[e.id]} />}
                  />
                ))
              ) : (
                <Empty icon={SearchX} title={hasFilters ? "Nenhum rolê com esses filtros" : "Ainda não tem rolê por aqui"}>
                  {hasFilters ? (
                    <Button
                      variant="ghost"
                      style={{ marginTop: 8 }}
                      onPress={() => {
                        clear();
                        setQ("");
                      }}
                    >
                      Limpar filtros
                    </Button>
                  ) : (
                    <T size={14} color={C.muted} center>
                      Volta mais tarde, sô. Toda hora entra rolê novo.
                    </T>
                  )}
                </Empty>
              )}
            </View>

            {!user ? (
              <View style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: R.lg, padding: 16 }}>
                <T size={14} color={C.muted} center>
                  Sem login você vê só eventos de classificação Livre. <LinkText onPress={() => router.push("/entrar")}>Entra</LinkText> pra ver tudo da sua idade.
                </T>
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
      <FilterSheet open={sheet} onClose={() => setSheet(false)} hoods={hoods} resultCount={events ? filtered.length : undefined} />
    </View>
  );
}
