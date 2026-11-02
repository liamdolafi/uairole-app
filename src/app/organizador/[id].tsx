import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/avatar";
import { EventCard } from "@/components/events/event-card";
import { CardFooter } from "@/components/events/going";
import { FollowButton } from "@/components/follow-button";
import { Button, Empty, ErrorBox, Loading, Row, Screen, T } from "@/components/ui";
import { errMsg } from "@/lib/format";
import { useFriendsGoing } from "@/lib/friends";
import { useGoing } from "@/lib/going";
import { shareLink } from "@/lib/site";
import { supabase } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { EVENT_SELECT, type EventWithVenue } from "@/lib/types";

type Org = { id: string; name: string; avatar_url: string | null };

export default function OrganizadorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [org, setOrg] = useState<Org | null | undefined>(undefined);
  const [events, setEvents] = useState<EventWithVenue[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const { data, error } = await supabase.from("public_profiles").select("id,name,avatar_url,role").eq("id", id).in("role", ["organizador", "admin"]).maybeSingle();
    if (error) return /invalid input syntax/i.test(error.message) ? setOrg(null) : setError(errMsg(error));
    setOrg((data as Org) ?? null);
    const { data: evs } = await supabase.from("events").select(EVENT_SELECT).eq("organizer_id", id).eq("status", "ativo").gt("ends_at", new Date().toISOString()).order("starts_at").limit(50);
    setEvents((evs ?? []) as EventWithVenue[]);
  }, [id]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, user?.id, load]);

  const ids = useMemo(() => events.map((e) => e.id), [events]);
  const going = useGoing(ids);
  const friends = useFriendsGoing(ids);

  if (error) return <Screen padTop={false}><ErrorBox message={error} onRetry={load} /></Screen>;
  if (org === undefined) return <Screen padTop={false}><Loading /></Screen>;
  if (org === null)
    return (
      <Screen padTop={false}>
        <Empty emoji="🕵️" title="Organizador não encontrado">
          <Button onPress={() => router.replace("/")}>Ver rolês</Button>
        </Empty>
      </Screen>
    );

  return (
    <Screen padTop={false}>
      <Stack.Screen options={{ title: org.name }} />
      <Row style={{ gap: 14 }}>
        <Avatar name={org.name} url={org.avatar_url} size={64} />
        <View style={{ flex: 1 }}>
          <T size={13} weight="semibold" color={C.accent}>🎪 Organizador</T>
          <T size={24} weight="displayBlack">{org.name}</T>
        </View>
      </Row>
      <FollowButton target={{ organizerId: org.id }} />
      <Button variant="ghost" onPress={() => shareLink({ title: org.name, message: `Os rolês de ${org.name} no Uai Rolê`, path: `/organizador/${org.id}` })}>📤 Compartilhar</Button>
      <T size={18} weight="display">📅 Próximos rolês</T>
      {events.length ? (
        events.map((e) => <EventCard key={e.id} e={e} footer={<CardFooter e={e} going={going} friends={friends[e.id]} />} />)
      ) : (
        <Empty emoji="📅" title="Nenhum rolê marcado">Siga pra ver os próximos rolês na sua aba Favoritos.</Empty>
      )}
    </Screen>
  );
}
