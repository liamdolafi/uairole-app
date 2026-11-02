import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/avatar";
import { EventCard } from "@/components/events/event-card";
import { GoingButton } from "@/components/events/going";
import { Card, Chip, Empty, ErrorBox, Input, Loading, LoginNeeded, Row, Screen, Spinner, T, s } from "@/components/ui";
import { addDays, errMsg, startOfDayBH, ymd } from "@/lib/format";
import { acceptFriend, removeFriendship, sendFriendRequest } from "@/lib/friends";
import { useGoing } from "@/lib/going";
import { supabase } from "@/lib/supabase";
import { C, R } from "@/lib/theme";
import { EVENT_SELECT, type EventWithVenue } from "@/lib/types";

type FriendRow = { friendship_id: string; id: string; name: string; avatar_url: string | null; status: string; incoming: boolean };
type Person = { id: string; name: string; avatar_url: string | null; relation: "amigo" | "enviado" | "recebido" | null };
type Activity = { event_id: string; user_id: string; name: string; avatar_url: string | null; kind: "vai" | "esta_la" };

const openPerson = (id: string) => router.push({ pathname: "/pessoa/[id]", params: { id } });

export default function Amigos() {
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<FriendRow[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Person[] | null>(null);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("my_friends");
    if (error) return setError(errMsg(error));
    setRows((data ?? []) as FriendRow[]);
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  // busca quando a pessoa para de digitar
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return setResults(null);
    setSearching(true);
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc("search_people", { q: term });
      setSearching(false);
      if (error) return setError(errMsg(error));
      setResults((data ?? []) as Person[]);
    }, 400);
    return () => clearTimeout(t);
  }, [q]);

  async function act(fn: () => PromiseLike<{ error: { message: string } | null }>) {
    setError("");
    const { error } = await fn();
    if (error) return setError(errMsg(error));
    await load();
    if (q.trim().length >= 2) {
      const { data } = await supabase.rpc("search_people", { q: q.trim() });
      setResults((data ?? []) as Person[]);
    }
  }

  if (loading) return <Screen padTop={false}><Loading /></Screen>;
  if (!user) return <Screen padTop={false}><LoginNeeded /></Screen>;

  const incoming = rows?.filter((r) => r.status === "pendente" && r.incoming) ?? [];
  const outgoing = rows?.filter((r) => r.status === "pendente" && !r.incoming) ?? [];
  const friends = rows?.filter((r) => r.status === "aceita") ?? [];

  return (
    <Screen padTop={false}>
      {error ? <ErrorBox message={error} /> : null}

      <FriendsActivity hasFriends={friends.length > 0} />

      <View style={{ gap: 10 }}>
        <T size={18} weight="display">Procurar pessoas</T>
        <Input placeholder="Digite o nome..." value={q} onChangeText={setQ} autoCapitalize="words" />
        {searching ? <Spinner small /> : null}
        {results && results.length === 0 ? <T size={14} color={C.muted}>Ninguém encontrado com esse nome.</T> : null}
        {results?.length ? (
          <List>
            {results.map((p) => (
              <PersonRow key={p.id} id={p.id} name={p.name} url={p.avatar_url}>
                {p.relation === "amigo" ? (
                  <T size={12} color={C.ok}>✓ Amigos</T>
                ) : p.relation === "enviado" ? (
                  <T size={12} color={C.muted}>Pedido enviado</T>
                ) : p.relation === "recebido" ? (
                  <T size={12} color={C.warn}>Te mandou pedido</T>
                ) : (
                  <SmallBtn label="+ Adicionar" primary onPress={() => act(() => sendFriendRequest(p.id))} />
                )}
              </PersonRow>
            ))}
          </List>
        ) : null}
        {q.trim().length < 2 ? <T size={12} color={C.muted}>Por segurança, menores de 18 só podem ser amigos de outros menores ou de quem tem até 2 anos de diferença.</T> : null}
      </View>

      {!rows ? <Loading /> : null}

      {incoming.length ? (
        <View style={{ gap: 10 }}>
          <T size={18} weight="display">Pedidos pra você</T>
          <List border={`${C.warn}66`}>
            {incoming.map((r) => (
              <PersonRow key={r.friendship_id} id={r.id} name={r.name} url={r.avatar_url}>
                <SmallBtn label="Aceitar" ok onPress={() => act(() => acceptFriend(r.friendship_id))} />
                <SmallBtn label="Recusar" onPress={() => act(() => removeFriendship(r.friendship_id))} />
              </PersonRow>
            ))}
          </List>
        </View>
      ) : null}

      {rows ? (
        <View style={{ gap: 10 }}>
          <T size={18} weight="display">Amigos ({friends.length})</T>
          {friends.length === 0 ? (
            <T size={14} color={C.muted}>Você ainda não tem amigos aqui. Procura pelo nome aí em cima!</T>
          ) : (
            <List>
              {friends.map((r) => (
                <PersonRow key={r.friendship_id} id={r.id} name={r.name} url={r.avatar_url}>
                  <SmallBtn
                    label="Desfazer"
                    onPress={() =>
                      Alert.alert(`Desfazer amizade com ${r.name}?`, undefined, [
                        { text: "Cancelar", style: "cancel" },
                        { text: "Desfazer", style: "destructive", onPress: () => act(() => removeFriendship(r.friendship_id)) },
                      ])
                    }
                  />
                </PersonRow>
              ))}
            </List>
          )}
        </View>
      ) : null}

      {outgoing.length ? (
        <View style={{ gap: 10 }}>
          <T size={14} weight="semibold" color={C.muted}>Pedidos enviados</T>
          <List>
            {outgoing.map((r) => (
              <PersonRow key={r.friendship_id} id={r.id} name={r.name} url={r.avatar_url}>
                <SmallBtn label="Cancelar" onPress={() => act(() => removeFriendship(r.friendship_id))} />
              </PersonRow>
            ))}
          </List>
        </View>
      ) : null}
    </Screen>
  );
}

function List({ children, border = C.line }: { children: React.ReactNode; border?: string }) {
  const items = (Array.isArray(children) ? children : [children]).filter(Boolean);
  return (
    <Card style={{ padding: 0, gap: 0, borderColor: border }}>
      {items.map((c, i) => (
        <View key={i}>
          {i ? <View style={s.divider} /> : null}
          {c}
        </View>
      ))}
    </Card>
  );
}

function PersonRow({ id, name, url, children }: { id: string; name: string; url: string | null; children: React.ReactNode }) {
  return (
    <Row style={{ padding: 12, gap: 12 }}>
      <Pressable onPress={() => openPerson(id)} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Avatar name={name} url={url} size={36} />
        <T size={14} weight="semibold" numberOfLines={1} style={{ flex: 1 }}>{name}</T>
      </Pressable>
      {children}
    </Row>
  );
}

function SmallBtn({ label, onPress, primary, ok }: { label: string; onPress: () => void; primary?: boolean; ok?: boolean }) {
  return (
    <Pressable onPress={onPress} style={{ borderRadius: R.sm, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: primary ? C.accent : ok ? `${C.ok}33` : C.surface2 }}>
      <T size={12} weight="semibold" color={primary ? C.white : ok ? C.ok : C.ink}>{label}</T>
    </Pressable>
  );
}

/** Rolês dos amigos: hoje e fim de semana (só de quem ligou o compartilhamento) */
function FriendsActivity({ hasFriends }: { hasFriends: boolean }) {
  const [when, setWhen] = useState<"hoje" | "fds">("hoje");
  const [acts, setActs] = useState<Activity[] | null>(null);
  const [events, setEvents] = useState<Record<string, EventWithVenue>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      const now = new Date();
      const today = startOfDayBH(ymd(now));
      let from = today;
      let to = addDays(today, 1);
      if (when === "fds") {
        const dow = new Date(`${ymd(now)}T12:00:00-03:00`).getUTCDay();
        from = addDays(today, dow === 0 ? -1 : 6 - dow);
        to = addDays(from, 2);
      }
      const { data } = await supabase.rpc("friends_activity", { p_from: from.toISOString(), p_to: to.toISOString() });
      const list = (data ?? []) as Activity[];
      const ids = [...new Set(list.map((a) => a.event_id))];
      const map: Record<string, EventWithVenue> = {};
      if (ids.length) {
        const { data: evs } = await supabase.from("events").select(EVENT_SELECT).in("id", ids);
        for (const e of (evs ?? []) as EventWithVenue[]) map[e.id] = e;
      }
      if (!alive) return;
      setEvents(map);
      setActs(list);
    })();
    return () => {
      alive = false;
    };
  }, [when]);

  const grouped = useMemo(() => {
    const g: Record<string, Activity[]> = {};
    for (const a of acts ?? []) if (events[a.event_id]) (g[a.event_id] ??= []).push(a);
    return Object.entries(g).sort(([a], [b]) => events[a].starts_at.localeCompare(events[b].starts_at));
  }, [acts, events]);
  const ids = useMemo(() => grouped.map(([id]) => id), [grouped]);
  const going = useGoing(ids);

  return (
    <View style={{ gap: 10 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <T size={18} weight="display">Rolês dos amigos</T>
        <Row>
          <Chip active={when === "hoje"} onPress={() => setWhen("hoje")}>Hoje</Chip>
          <Chip active={when === "fds"} onPress={() => setWhen("fds")}>Fim de semana</Chip>
        </Row>
      </Row>
      {!acts ? (
        <Loading />
      ) : grouped.length === 0 ? (
        <Empty emoji="🫂" title={hasFriends ? "Nenhum rolê dos amigos" : "Adicione amigos"}>
          {hasFriends
            ? "Seus amigos ainda não marcaram rolê pra esse período (ou não ligaram o compartilhamento)."
            : "Quando seus amigos marcarem “Eu vou”, os rolês deles aparecem aqui."}
        </Empty>
      ) : (
        grouped.map(([id, list]) => {
          const there = list.filter((a) => a.kind === "esta_la");
          const go = list.filter((a) => a.kind === "vai" && !there.some((t) => t.user_id === a.user_id));
          return (
            <EventCard
              key={id}
              e={events[id]}
              footer={
                <View style={{ gap: 8 }}>
                  {there.length ? <FriendsLine list={there} color={C.ok} text={`📍 ${names(there)} ${there.length === 1 ? "está" : "estão"} lá agora`} /> : null}
                  {go.length ? <FriendsLine list={go} color={C.muted} text={`${names(go)} ${go.length === 1 ? "vai" : "vão"}`} /> : null}
                  <GoingButton eventId={id} endsAt={events[id].ends_at} going={going} />
                </View>
              }
            />
          );
        })
      )}
    </View>
  );
}

const names = (l: Activity[]) => l.map((a) => a.name.split(" ")[0]).join(", ");

function FriendsLine({ list, color, text }: { list: Activity[]; color: string; text: string }) {
  return (
    <Row>
      <View style={{ flexDirection: "row" }}>
        {list.slice(0, 3).map((a, i) => (
          <View key={a.user_id} style={{ marginLeft: i ? -8 : 0 }}>
            <Avatar name={a.name} url={a.avatar_url} size={22} />
          </View>
        ))}
      </View>
      <T size={12} color={color} style={{ flex: 1 }}>{text}</T>
    </Row>
  );
}
