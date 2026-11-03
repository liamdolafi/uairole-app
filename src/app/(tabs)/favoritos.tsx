import { HeartCrack } from "lucide-react-native";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { RefreshControl, View } from "react-native";
import { useAuth } from "@/components/auth-provider";
import { EventCard } from "@/components/events/event-card";
import { CardFooter } from "@/components/events/going";
import { Button, Empty, ErrorBox, LinkText, Loading, LoginNeeded, PageTitle, Screen, Spinner, T } from "@/components/ui";
import { useThermo } from "@/lib/events";
import { errMsg, isLive } from "@/lib/format";
import { useFriendsGoing } from "@/lib/friends";
import { useGoing } from "@/lib/going";
import { supabase } from "@/lib/supabase";
import { C, R } from "@/lib/theme";
import { EVENT_SELECT, type EventWithVenue } from "@/lib/types";

type Follow = { venue_id: string | null; organizer_id: string | null };

export default function Favoritos() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<EventWithVenue[] | null>(null);
  const [following, setFollowing] = useState<EventWithVenue[] | null>(null);
  const [follows, setFollows] = useState<Follow[]>([]);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loadedAt, setLoadedAt] = useState(0);

  const load = useCallback(async () => {
    if (!user) return;
    setError("");
    const { data, error } = await supabase.from("favorites").select("created_at, event:events(*, venue:venues(*))").order("created_at", { ascending: false });
    if (error) return setError(errMsg(error));
    setLoadedAt(Date.now());
    setEvents(
      ((data ?? []) as unknown as { event: EventWithVenue | null }[])
        .map((f) => f.event)
        .filter((e): e is EventWithVenue => Boolean(e && e.venue && e.status === "ativo")),
    );

    // Seguindo: próximos eventos dos locais e organizadores que a pessoa segue
    const { data: fl, error: e2 } = await supabase.from("follows").select("venue_id, organizer_id");
    if (e2) return setError(errMsg(e2));
    const list = (fl ?? []) as Follow[];
    setFollows(list);
    const venues = list.map((f) => f.venue_id).filter(Boolean) as string[];
    const orgs = list.map((f) => f.organizer_id).filter(Boolean) as string[];
    if (!venues.length && !orgs.length) return setFollowing([]);
    const ors = [venues.length ? `venue_id.in.(${venues.join(",")})` : "", orgs.length ? `organizer_id.in.(${orgs.join(",")})` : ""].filter(Boolean);
    const { data: evs, error: e3 } = await supabase.from("events").select(EVENT_SELECT).or(ors.join(",")).eq("status", "ativo").gt("ends_at", new Date().toISOString()).order("starts_at").limit(30);
    if (e3) return setError(errMsg(e3));
    setFollowing((evs ?? []) as EventWithVenue[]);
  }, [user]);

  // atualiza sempre que a aba abre (a pessoa pode ter favoritado em outra tela)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const { upcoming, past } = useMemo(() => {
    const n = loadedAt;
    const all = events ?? [];
    return {
      upcoming: all.filter((e) => new Date(e.ends_at).getTime() > n).sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
      past: all.filter((e) => new Date(e.ends_at).getTime() <= n),
    };
  }, [events, loadedAt]);

  const liveIds = useMemo(() => upcoming.filter((e) => isLive(e.starts_at, e.ends_at)).map((e) => e.id), [upcoming]);
  const thermo = useThermo(liveIds);
  const allIds = useMemo(() => [...upcoming, ...(following ?? [])].map((e) => e.id), [upcoming, following]);
  const going = useGoing(allIds);
  const friendsGoing = useFriendsGoing(allIds);

  if (authLoading) return <Screen><Loading /></Screen>;
  if (!user) return <Screen><PageTitle>Favoritos</PageTitle><LoginNeeded text="Entra pra guardar seus rolês favoritos e seguir locais e organizadores." /></Screen>;

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={C.accent}
          colors={[C.accent]}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
    >
      <PageTitle sub="Os rolês que você não quer perder.">Favoritos</PageTitle>
      {error ? <ErrorBox message={error} onRetry={load} /> : null}
      {!events && !error ? <Loading /> : null}
      {events && events.length === 0 ? (
        <Empty icon={HeartCrack} title="Nenhum favorito ainda">
          <T size={14} color={C.muted} center>Toca no coração de um rolê pra ele aparecer aqui.</T>
          <Button onPress={() => router.navigate("/")} style={{ marginTop: 12 }}>Descobrir rolês</Button>
        </Empty>
      ) : null}
      {upcoming.map((e) => (
        <EventCard key={e.id} e={e} thermo={thermo[e.id]} footer={<CardFooter e={e} going={going} friends={friendsGoing[e.id]} />} />
      ))}

      <View style={{ gap: 12 }}>
        <T size={18} weight="display">Seguindo</T>
        {!following && !error ? <Spinner /> : null}
        {following && follows.length === 0 ? (
          <View style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: R.lg, padding: 16 }}>
            <T size={14} color={C.muted}>
              Você ainda não segue ninguém. Abre a página de um local ou organizador e toca em <T size={14} weight="bold">+ Seguir</T>.
            </T>
          </View>
        ) : null}
        {following && follows.length > 0 && following.length === 0 ? <T size={14} color={C.muted}>Quem você segue ainda não marcou rolê novo.</T> : null}
        {(following ?? []).map((e) => (
          <EventCard key={`f-${e.id}`} e={e} footer={<CardFooter e={e} going={going} friends={friendsGoing[e.id]} />} />
        ))}
        {follows.length ? (
          <T size={12} color={C.muted}>
            Seguindo {follows.length} {follows.length === 1 ? "local/organizador" : "locais/organizadores"}. <LinkText size={12} onPress={() => router.navigate("/")}>Descobrir mais</LinkText>
          </T>
        ) : null}
      </View>

      {past.length ? (
        <View style={{ gap: 12 }}>
          <T size={18} weight="display" color={C.muted}>Já rolaram</T>
          {past.map((e) => (
            <EventCard key={`p-${e.id}`} e={e} dim />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
