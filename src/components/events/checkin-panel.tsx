import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { errMsg, formatTime } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { C, R } from "@/lib/theme";
import { useAuth } from "../auth-provider";
import { Button, ErrorBox, LinkText, Notice, T } from "../ui";

const SCALES = [
  { key: "crowd", label: "Lotação", options: ["🫥", "🙂", "😃", "🤩", "🔥"], hint: ["Vazio", "Lotado"] },
  { key: "music", label: "Música", options: ["😴", "😐", "🙂", "🎶", "🎉"], hint: ["Fraca", "Top"] },
  { key: "vibe", label: "Vibe", options: ["😞", "😐", "🙂", "😄", "🤯"], hint: ["Baixa", "Insana"] },
] as const;

type Scores = { crowd: number; music: number; vibe: number };

/** Check-in: só durante o evento, a até 200 m, 1 por hora. A localização vai só pro banco medir a distância e não é guardada. */
export function CheckinPanel({ eventId, live, onDone }: { eventId: string; live: boolean; onDone: () => void }) {
  const { user } = useAuth();
  const [scores, setScores] = useState<Scores>({ crowd: 0, music: 0, vibe: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [denied, setDenied] = useState(false);
  const [lastAt, setLastAt] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState(0);

  const loadLast = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("checkins").select("created_at").eq("event_id", eventId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    setCheckedAt(Date.now());
    setLastAt(data?.created_at ?? null);
  }, [user, eventId]);

  useEffect(() => {
    loadLast();
  }, [loadLast]);

  if (!live) return <T size={14} color={C.muted}>⏰ O check-in abre quando o rolê começar.</T>;
  if (!user)
    return (
      <View style={{ gap: 10 }}>
        <T size={14} color={C.muted}>Tá no rolê? Entra na sua conta pra fazer check-in e contar como tá.</T>
        <Button onPress={() => router.push("/entrar")}>Entrar</Button>
      </View>
    );

  if (lastAt && checkedAt - new Date(lastAt).getTime() < 3600000) {
    return (
      <Notice>
        ✅ Você fez check-in às {formatTime(lastAt)}. Pode fazer de novo às {formatTime(new Date(new Date(lastAt).getTime() + 3600000).toISOString())}.
      </Notice>
    );
  }

  async function checkin() {
    if (!scores.crowd || !scores.music || !scores.vibe) return setError("Dá uma nota pra lotação, música e vibe.");
    setBusy(true);
    setError("");
    setDenied(false);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        setDenied(true);
        throw new Error("Precisamos da sua localização (só na hora) pra confirmar que você tá no local.");
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      // a posição vai só pra conferir a distância; o banco não guarda
      const { error } = await supabase.rpc("do_checkin", {
        p_event: eventId,
        p_lat: pos.coords.latitude,
        p_lng: pos.coords.longitude,
        p_crowd: scores.crowd,
        p_music: scores.music,
        p_vibe: scores.vibe,
      });
      if (error) throw error;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setScores({ crowd: 0, music: 0, vibe: 0 });
      await loadLast();
      onDone();
    } catch (e) {
      const m = errMsg(e);
      setError(/location|unavailable|timeout/i.test(m) && !/200 m/.test(m) ? "Não deu pra achar sua localização. Liga o GPS e tenta de novo." : m);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 12 }}>
      <T size={14} color={C.muted}>Tá no rolê? Conta pra galera como tá (precisa estar a até 200 m do local).</T>
      {SCALES.map((s) => (
        <View key={s.key} style={{ gap: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <T size={13} weight="semibold">{s.label}</T>
            <T size={12} color={C.muted}>{s.hint[0]} → {s.hint[1]}</T>
          </View>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {s.options.map((emoji, i) => {
              const v = i + 1;
              const on = scores[s.key] === v;
              return (
                <Pressable
                  key={v}
                  accessibilityLabel={`${s.label} ${v}`}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setScores((old) => ({ ...old, [s.key]: v }));
                  }}
                  style={{ flex: 1, height: 46, borderRadius: R.md, alignItems: "center", justifyContent: "center", backgroundColor: on ? C.accent : C.surface2, transform: [{ scale: on ? 1.05 : 1 }] }}
                >
                  <T size={22}>{emoji}</T>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      {error ? <ErrorBox message={error} /> : null}
      {denied ? <LinkText onPress={() => Linking.openSettings()}>Abrir configurações do celular</LinkText> : null}
      <Button onPress={checkin} loading={busy}>📍 Fazer check-in</Button>
    </View>
  );
}
