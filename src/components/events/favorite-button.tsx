import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable } from "react-native";
import { supabase } from "@/lib/supabase";
import { C, R } from "@/lib/theme";
import { useAuth } from "../auth-provider";
import { T } from "../ui";

export function FavoriteButton({ eventId }: { eventId: string }) {
  const { user } = useAuth();
  const [fav, setFav] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return setFav(false);
    supabase
      .from("favorites")
      .select("event_id")
      .eq("event_id", eventId)
      .maybeSingle()
      .then(({ data }) => setFav(Boolean(data)));
  }, [user, eventId]);

  async function toggle() {
    if (!user) return router.push("/entrar");
    setBusy(true);
    const was = fav;
    setFav(!was);
    const { error } = was
      ? await supabase.from("favorites").delete().eq("event_id", eventId).eq("user_id", user.id)
      : await supabase.from("favorites").insert({ event_id: eventId });
    if (error) setFav(was);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setBusy(false);
  }

  return (
    <Pressable
      onPress={toggle}
      disabled={busy}
      style={{ flex: 1, height: 46, borderRadius: R.md, backgroundColor: fav ? C.accentSoft : C.surface2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
    >
      <Ionicons name={fav ? "heart" : "heart-outline"} size={18} color={fav ? C.accent : C.ink} />
      <T size={14} weight="semibold" color={fav ? C.accent : C.ink}>{fav ? "Favoritado" : "Favoritar"}</T>
    </Pressable>
  );
}
