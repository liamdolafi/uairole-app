import { router, useFocusEffect } from "expo-router";
import { ChevronRight, MapPin, Plus, Store } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import { Icon } from "@/components/icons";
import { Button, Empty, ErrorBox, Loading, LoginNeeded, Row, Screen, T } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { errMsg } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { C, R } from "@/lib/theme";
import type { Venue } from "@/lib/types";

/** Meus locais (o admin vê todos) */
export default function LocaisScreen() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Venue[] | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    if (!profile) return;
    let q = supabase.from("venues").select("*").order("archived").order("name");
    if (profile.role !== "admin") q = q.eq("owner_id", profile.id);
    const { data, error } = await q;
    if (error) return setErr(errMsg(error));
    setItems((data ?? []) as Venue[]);
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!profile) return <Screen padTop={false}><LoginNeeded /></Screen>;
  return (
    <Screen padTop={false} onRefresh={load}>
      <Button onPress={() => router.push({ pathname: "/painel/local/[id]", params: { id: "novo" } })}>
        <Row>
          <Icon icon={Plus} size={18} color={C.white} />
          <T weight="semibold" color={C.white}>Novo local</T>
        </Row>
      </Button>
      {err ? <ErrorBox message={err} onRetry={load} /> : null}
      {!items ? <Loading /> : items.length === 0 ? <Empty icon={Store} title="Nenhum local ainda">Todo evento acontece num local. Cadastre o seu primeiro.</Empty> : null}
      {items?.map((v) => (
        <Pressable
          key={v.id}
          onPress={() => router.push({ pathname: "/painel/local/[id]", params: { id: v.id } })}
          accessibilityRole="button"
          style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, minHeight: 56, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, backgroundColor: pressed ? C.surface2 : C.surface, opacity: v.archived ? 0.6 : 1 })}
        >
          <Icon icon={MapPin} size={18} color={C.accent} />
          <View style={{ flex: 1 }}>
            <T weight="semibold" numberOfLines={1}>{v.name}</T>
            <T size={12} color={C.muted} numberOfLines={1}>{v.neighborhood}{v.archived ? " · desativado" : ""}</T>
          </View>
          <Icon icon={ChevronRight} size={18} color={C.muted} />
        </Pressable>
      ))}
    </Screen>
  );
}
