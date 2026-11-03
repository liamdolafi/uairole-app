import { Icon } from "@/components/icons";
import { Flame, Music, Sparkles, Thermometer, Users } from "lucide-react-native";
import { View } from "react-native";
import type { Thermo } from "@/lib/types";
import { C, R } from "@/lib/theme";
import { T } from "../ui";

export function thermoLabel(score: number) {
  if (score >= 80) return "Pegando fogo";
  if (score >= 60) return "Bombando";
  if (score >= 40) return "Animado";
  if (score >= 20) return "Morninho";
  return "Parado";
}

function thermoColor(score: number) {
  if (score >= 70) return "#ff2e88";
  if (score >= 45) return "#ff7a1a";
  if (score >= 25) return "#ffb020";
  return "#5b8cff";
}

export function ThermoBar({ t, compact }: { t?: Thermo; compact?: boolean }) {
  if (!t)
    return compact ? null : (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Icon icon={Thermometer} size={14} color={C.muted} />
        <T size={12} color={C.muted}>Sem check-ins nas últimas 2h</T>
      </View>
    );
  const color = thermoColor(t.score);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
        <Icon icon={Flame} size={14} color={color} />
        <T size={12} weight="bold" color={color}>{t.score}°</T>
      </View>
      <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: C.surface2, overflow: "hidden" }}>
        <View style={{ height: "100%", width: `${Math.max(6, t.score)}%`, backgroundColor: color, borderRadius: 3 }} />
      </View>
      {!compact ? <T size={12} color={C.muted}>{thermoLabel(t.score)}</T> : null}
    </View>
  );
}

export function ThermoDetail({ t }: { t?: Thermo }) {
  if (!t) return <T size={14} color={C.muted}>Ninguém fez check-in nas últimas 2 horas. Tá lá? Seja o primeiro a contar como tá!</T>;
  const items = [
    { label: "Lotação", v: t.crowd, icon: Users },
    { label: "Música", v: t.music, icon: Music },
    { label: "Vibe", v: t.vibe, icon: Sparkles },
  ];
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
        <T size={38} weight="displayBlack" color={C.accent}>{t.score}°</T>
        <T size={13} color={C.muted}>
          {thermoLabel(t.score)} · {t.checkins} check-in{t.checkins === 1 ? "" : "s"} em 2h
        </T>
      </View>
      <ThermoBar t={t} compact />
      <View style={{ flexDirection: "row", gap: 8 }}>
        {items.map((i) => (
          <View key={i.label} style={{ flex: 1, backgroundColor: C.surface2, borderRadius: R.md, padding: 8, alignItems: "center" }}>
            <Icon icon={i.icon} size={18} color={C.accent} />
            <T weight="bold">{Number(i.v).toFixed(1)}</T>
            <T size={11} color={C.muted}>{i.label}</T>
          </View>
        ))}
      </View>
    </View>
  );
}
