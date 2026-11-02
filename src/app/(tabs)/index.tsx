import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, TextInput, View } from "react-native";
import { useAuth } from "@/components/auth-provider";
import { EventCard, HotCard, NightCard } from "@/components/events/event-card";
import { CardFooter } from "@/components/events/going";
import { Chip, ChipRow, Empty, ErrorBox, LinkText, Loading, Row, Sheet, T } from "@/components/ui";
import { fetchUpcoming, matchesTime, TIME_FILTERS, useThermo, type TimeFilter } from "@/lib/events";
import { errMsg, isLive, normalizeSearch } from "@/lib/format";
import { useFriendsGoing } from "@/lib/friends";
import { useGoing } from "@/lib/going";
import { C, F, R } from "@/lib/theme";
import { CATEGORIES, PRICE_LEVELS, planOf, priceLevelOf, type Category, type EventWithVenue, type PriceLevel } from "@/lib/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Descobrir() {
  const { user, loading: authLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<EventWithVenue[] | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [time, setTime] = useState<TimeFilter>("tudo");
  const [cat, setCat] = useState<Category | "">("");
  const [hood, setHood] = useState("");
  const [hoodOpen, setHoodOpen] = useState(false);
  const [q, setQ] = useState("");
  const [price, setPrice] = useState<PriceLevel | 0>(0);

  const load = useCallback(async () => {
    setError("");
    try {
      setEvents(await fetchUpcoming());
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

  const filtered = useMemo(() => {
    const term = normalizeSearch(q.trim());
    return (events ?? []).filter((e) => {
      if (!matchesTime(e, time)) return false;
      if (cat && e.category !== cat) return false;
      if (hood && e.venue?.neighborhood !== hood) return false;
      if (price && priceLevelOf(e) !== price) return false;
      if (term && !normalizeSearch(e.title).includes(term)) return false;
      return true;
    });
  }, [events, time, cat, hood, q, price]);

  const hasFilters = Boolean(time !== "tudo" || cat || hood || q || price);
  const nights = useMemo(() => (events ?? []).filter((e) => planOf(e) === "role_da_noite").slice(0, 10), [events]);

  function clear() {
    setTime("tudo");
    setCat("");
    setHood("");
    setQ("");
    setPrice(0);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 40, gap: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.accent} colors={[C.accent]} />}
    >
      <View style={{ gap: 4 }}>
        <T size={30} weight="displayBlack" style={{ lineHeight: 34 }}>
          Qual é o rolê <T size={30} weight="displayBlack" color={C.accent}>hoje</T>, sô?
        </T>
        <T size={14} color={C.muted}>Festas, shows, peladas e muito mais em BH.</T>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, height: 46, borderRadius: R.md, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, paddingHorizontal: 12 }}>
        <Ionicons name="search" size={18} color={C.muted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Buscar rolê pelo nome"
          placeholderTextColor={`${C.muted}aa`}
          selectionColor={C.accent}
          returnKeyType="search"
          style={{ flex: 1, color: C.ink, fontFamily: F.regular, fontSize: 15, height: "100%" }}
        />
        {q ? (
          <Pressable onPress={() => setQ("")} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={C.muted} />
          </Pressable>
        ) : null}
      </View>

      {error ? <ErrorBox message={error} onRetry={load} /> : null}
      {!events && !error ? <Loading text="Procurando os rolês..." /> : null}

      {events ? (
        <>
          {nights.length && !hasFilters ? (
            <View style={{ gap: 10 }}>
              <T size={18} weight="display" color={C.accent}>⭐ Rolê da noite</T>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }} snapToInterval={292} decelerationRate="fast">
                {nights.map((e) => (
                  <NightCard key={e.id} e={e} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {hot.length && !hasFilters ? (
            <View style={{ gap: 10 }}>
              <T size={18} weight="display">🔥 Bombando agora</T>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
                {hot.map((e) => (
                  <HotCard key={e.id} e={e} thermo={thermo[e.id]} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={{ gap: 10 }}>
            <ChipRow>
              {TIME_FILTERS.map((f) => (
                <Chip key={f.id} active={time === f.id} onPress={() => setTime(f.id)}>
                  {f.label}
                </Chip>
              ))}
            </ChipRow>
            <ChipRow>
              <Chip active={!cat} onPress={() => setCat("")}>Todas</Chip>
              {CATEGORIES.map((c) => (
                <Chip key={c.id} active={cat === c.id} onPress={() => setCat(cat === c.id ? "" : c.id)}>
                  {c.emoji} {c.label}
                </Chip>
              ))}
            </ChipRow>
            <ChipRow>
              <Chip active={!!hood} onPress={() => setHoodOpen(true)}>📍 {hood || "Todos os bairros"} ▾</Chip>
              <Chip active={!price} onPress={() => setPrice(0)}>Qualquer preço</Chip>
              {PRICE_LEVELS.map((p) => (
                <Chip key={p.id} active={price === p.id} onPress={() => setPrice(price === p.id ? 0 : p.id)}>
                  {p.label}
                </Chip>
              ))}
            </ChipRow>
          </View>

          <View style={{ gap: 14 }}>
            {filtered.length ? (
              filtered.map((e) => <EventCard key={e.id} e={e} thermo={thermo[e.id]} footer={<CardFooter e={e} going={going} friends={friendsGoing[e.id]} />} />)
            ) : (
              <Empty emoji="🦗" title="Nenhum rolê achado">
                {hasFilters ? <LinkText onPress={clear}>Limpar filtros</LinkText> : <T size={14} color={C.muted} center>Ainda não tem rolê cadastrado. Volta mais tarde!</T>}
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

      <Sheet open={hoodOpen} onClose={() => setHoodOpen(false)} title="📍 Bairro">
        <ScrollView style={{ maxHeight: 380 }}>
          {["", ...hoods].map((h) => (
            <Pressable
              key={h || "todos"}
              onPress={() => {
                setHood(h);
                setHoodOpen(false);
              }}
              style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line }}
            >
              <Row style={{ justifyContent: "space-between" }}>
                <T weight={hood === h ? "bold" : "regular"} color={hood === h ? C.accent : C.ink}>{h || "Todos os bairros"}</T>
                {hood === h ? <Ionicons name="checkmark" size={18} color={C.accent} /> : null}
              </Row>
            </Pressable>
          ))}
        </ScrollView>
      </Sheet>
    </ScrollView>
  );
}
