import * as Calendar from "expo-calendar/legacy";
import * as Haptics from "expo-haptics";
import { CalendarPlus } from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable } from "react-native";
import { Icon } from "@/components/icons";
import { T } from "@/components/ui";
import type { CalEvent } from "@/lib/calendar";
import { C, R } from "@/lib/theme";

/** Abre a tela do próprio celular pra salvar o rolê no calendário (a pessoa confirma lá) */
export function AddToCalendar({ event }: { event: CalEvent }) {
  const [busy, setBusy] = useState(false);
  async function add() {
    setBusy(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      await Calendar.createEventInCalendarAsync({
        title: event.title,
        startDate: new Date(event.starts_at),
        endDate: new Date(event.ends_at),
        location: event.place,
        notes: `${(event.description ?? "").slice(0, 500)}\n\n${event.url}`.trim(),
        url: event.url,
        timeZone: "America/Sao_Paulo",
      });
    } catch {
      Alert.alert("Não deu pra abrir o calendário", "Confere se o app de calendário está instalado e tenta de novo.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Pressable
      onPress={add}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel="Adicionar ao calendário"
      style={{ minHeight: 48, borderRadius: R.md, backgroundColor: C.surface2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, opacity: busy ? 0.6 : 1 }}
    >
      <Icon icon={CalendarPlus} size={18} />
      <T size={14} weight="semibold">Adicionar ao calendário</T>
    </Pressable>
  );
}
