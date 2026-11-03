import { CalendarDays, CalendarX, SearchX, Wallet } from "lucide-react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useAuth } from "@/components/auth-provider";
import { EventCard, PriceLevelBadge } from "@/components/events/event-card";
import { CardFooter } from "@/components/events/going";
import { FollowButton } from "@/components/follow-button";
import { Pin } from "@/components/map/pin";
import { MenuView } from "@/components/menu-view";
import { Button, Chip, Empty, ErrorBox, Loading, Row, Screen, T } from "@/components/ui";
import { errMsg } from "@/lib/format";
import { useFriendsGoing } from "@/lib/friends";
import { useGoing } from "@/lib/going";
import { openDirections, shareLink } from "@/lib/site";
import { supabase } from "@/lib/supabase";
import { C, R } from "@/lib/theme";
import { EVENT_SELECT, type EventWithVenue, type Venue } from "@/lib/types";

export default function LocalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [venue, setVenue] = useState<Venue | null | undefined>(undefined);
  const [events, setEvents] = useState<EventWithVenue[]>([]);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"roles" | "precos">("roles");

  const load = useCallback(async () => {
    setError("");
    const { data, error } = await supabase.from("venues").select("*").eq("id", id).maybeSingle();
    if (error) return /invalid input syntax/i.test(error.message) ? setVenue(null) : setError(errMsg(error));
    setVenue((data as Venue) ?? null);
    const { data: evs } = await supabase.from("events").select(EVENT_SELECT).eq("venue_id", id).eq("status", "ativo").gt("ends_at", new Date().toISOString()).order("starts_at").limit(50);
    setEvents((evs ?? []) as EventWithVenue[]);
  }, [id]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, user?.id, load]);

  const ids = useMemo(() => events.map((e) => e.id), [events]);
  const going = useGoing(ids);
  const friends = useFriendsGoing(ids);

  if (error) return <Screen padTop={false}><ErrorBox message={error} onRetry={load} /></Screen>;
  if (venue === undefined) return <Screen padTop={false}><Loading /></Screen>;
  if (venue === null)
    return (
      <Screen padTop={false}>
        <Empty icon={SearchX} title="Local não encontrado">
          <Button onPress={() => router.replace("/")}>Ver rolês</Button>
        </Empty>
      </Screen>
    );

  return (
    <Screen padTop={false} onRefresh={load}>
      <Stack.Screen options={{ title: venue.name }} />
      <View style={{ height: 180, borderRadius: R.lg, overflow: "hidden", borderWidth: 1, borderColor: C.line }}>
        <MapView
          style={{ flex: 1 }}
          userInterfaceStyle="dark"
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          initialRegion={{ latitude: venue.lat, longitude: venue.lng, latitudeDelta: 0.008, longitudeDelta: 0.008 }}
          onPress={() => openDirections(venue.lat, venue.lng, venue.name)}
        >
          <Marker coordinate={{ latitude: venue.lat, longitude: venue.lng }} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
            <Pin category="outro" />
          </Marker>
        </MapView>
      </View>
      <View style={{ gap: 4 }}>
        <T size={14} weight="semibold" color={C.accent}>Local</T>
        <T size={28} weight="displayBlack" style={{ lineHeight: 32 }}>{venue.name}</T>
        <T size={14} color={C.muted}>
          {venue.address ? `${venue.address} · ` : ""}
          {venue.neighborhood}
          {venue.price_level ? "  " : ""}
          {venue.price_level ? <PriceLevelBadge level={venue.price_level} size={14} /> : null}
        </T>
      </View>
      <FollowButton target={{ venueId: venue.id }} />
      <Row>
        <Button variant="ghost" style={{ flex: 1 }} onPress={() => openDirections(venue.lat, venue.lng, venue.name)}>Como chegar</Button>
        <Button variant="ghost" style={{ flex: 1 }} onPress={() => shareLink({ title: venue.name, message: `${venue.name} — ${venue.neighborhood}, BH. Bora?`, path: `/local/${venue.id}` })}>
          Compartilhar
        </Button>
      </Row>
      <Row>
        <Chip icon={CalendarDays} active={tab === "roles"} onPress={() => setTab("roles")}>Próximos rolês</Chip>
        <Chip icon={Wallet} active={tab === "precos"} onPress={() => setTab("precos")}>Preços</Chip>
      </Row>
      {tab === "precos" ? (
        <MenuView venueId={venue.id} />
      ) : events.length ? (
        events.map((e) => <EventCard key={e.id} e={e} footer={<CardFooter e={e} going={going} friends={friends[e.id]} />} />)
      ) : (
        <Empty icon={CalendarX} title="Nenhum rolê marcado">Siga o local pra ver os próximos rolês na sua aba Favoritos.</Empty>
      )}
    </Screen>
  );
}
