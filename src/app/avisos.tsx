import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, View } from "react-native";
import { useAuth } from "@/components/auth-provider";
import { Card, Empty, Loading, LoginNeeded, Screen, T, s } from "@/components/ui";
import { timeAgo } from "@/lib/feed";
import { openAppUrl } from "@/lib/links";
import { supabase } from "@/lib/supabase";
import { C } from "@/lib/theme";

type Notif = { id: string; title: string; body: string | null; url: string | null; read_at: string | null; created_at: string };

/** Avisos (o mesmo 🔔 do site): sócio, amigos... */
export default function Avisos() {
  const { user, loading } = useAuth();
  const [list, setList] = useState<Notif[] | null>(null);
  const [now, setNow] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
    setNow(Date.now());
    setList((data ?? []) as Notif[]);
    // marca tudo como lido
    if ((data ?? []).some((n) => !n.read_at)) await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (loading) return <Screen padTop={false}><Loading /></Screen>;
  if (!user) return <Screen padTop={false}><LoginNeeded /></Screen>;
  if (!list) return <Screen padTop={false}><Loading /></Screen>;

  return (
    <Screen
      padTop={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={C.accent}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
    >
      {list.length === 0 ? (
        <Empty emoji="📭" title="Nenhum aviso">Quando tiver novidade (pedido de amizade, Rolê da noite...), aparece aqui.</Empty>
      ) : (
        <Card style={{ padding: 0, gap: 0 }}>
          {list.map((n, i) => (
            <View key={n.id}>
              {i ? <View style={s.divider} /> : null}
              <Pressable onPress={() => openAppUrl(n.url)} style={{ padding: 14, gap: 2, backgroundColor: n.read_at ? "transparent" : C.accentSoft }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                  <T size={14} weight="bold" style={{ flex: 1 }}>{n.title}</T>
                  <T size={12} color={C.muted}>{timeAgo(n.created_at, now)}</T>
                </View>
                {n.body ? <T size={14} color={C.muted}>{n.body}</T> : null}
              </Pressable>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}
