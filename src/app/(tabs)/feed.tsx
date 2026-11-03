import { Flame, MessageCircle } from "lucide-react-native";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, RefreshControl, View } from "react-native";
import { useAuth } from "@/components/auth-provider";
import { Cover } from "@/components/events/event-card";
import { Composer } from "@/components/feed/composer";
import { PostList } from "@/components/feed/post-list";
import { Button, Chip, Empty, Row, Screen, T } from "@/components/ui";
import { formatWhen } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { C, R } from "@/lib/theme";
import { EVENT_SELECT, planOf, type EventWithVenue } from "@/lib/types";

export default function Feed() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"recentes" | "alta">("recentes");
  const [key, setKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const first = useRef(true);

  // volta pra aba: atualiza (sem piscar na primeira vez)
  useFocusEffect(
    useCallback(() => {
      if (first.current) first.current = false;
      else setKey((k) => k + 1);
    }, []),
  );

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={C.accent}
          colors={[C.accent]}
          onRefresh={() => {
            setRefreshing(true);
            setKey((k) => k + 1);
            setTimeout(() => setRefreshing(false), 600);
          }}
        />
      }
      contentStyle={{ gap: 12 }}
    >
      <Row style={{ justifyContent: "space-between" }}>
        <T size={28} weight="displayBlack">Feed</T>
        <Row>
          <Chip active={mode === "recentes"} onPress={() => setMode("recentes")}>Recentes</Chip>
          <Chip icon={Flame} active={mode === "alta"} onPress={() => setMode("alta")}>Em alta</Chip>
        </Row>
      </Row>

      <PinnedNights refreshKey={key} />

      {loading ? null : user ? (
        <Composer onPosted={() => setKey((k) => k + 1)} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, padding: 12 }}>
          <T size={14} color={C.muted} style={{ flex: 1 }}>Entre pra postar, curtir e responder.</T>
          <Button small onPress={() => router.push("/entrar")}>Entrar</Button>
        </View>
      )}

      <PostList mode={mode} refreshKey={key} empty={<Empty icon={MessageCircle} title="O Feed tá quietinho">Seja o primeiro a contar o que tá rolando em BH!</Empty>} />
    </Screen>
  );
}

/** Posts fixados: eventos com Holofote que ainda não acabaram */
function PinnedNights({ refreshKey }: { refreshKey: number }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventWithVenue[]>([]);

  useEffect(() => {
    supabase
      .from("events")
      .select(EVENT_SELECT)
      .eq("status", "ativo")
      .eq("featured", true)
      .gt("ends_at", new Date().toISOString())
      .order("starts_at")
      .limit(10)
      .then(({ data }) => setEvents(((data ?? []) as EventWithVenue[]).filter((e) => planOf(e) === "holofote").slice(0, 3)));
  }, [user?.id, refreshKey]);

  if (!events.length) return null;
  return (
    <View style={{ gap: 8 }}>
      {events.map((e) => (
        <Pressable
          key={e.id}
          onPress={() => router.push({ pathname: "/evento/[id]", params: { id: e.id } })}
          style={{ flexDirection: "row", gap: 12, borderRadius: R.lg, borderWidth: 1, borderColor: `${C.accent}80`, backgroundColor: C.accentSoft, padding: 12 }}
        >
          <Cover e={e} style={{ width: 60, height: 60, borderRadius: R.md }} artSize={64} />
          <View style={{ flex: 1, gap: 2 }}>
            <T size={11} weight="bold" color={C.accent}>FIXADO · HOLOFOTE</T>
            <T weight="semibold" numberOfLines={1}>{e.title}</T>
            <T size={12} color={C.muted} numberOfLines={1}>{formatWhen(e.starts_at, e.ends_at)} · {e.venue?.neighborhood}</T>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
