import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { formatPrice, formatWhen, isLive } from "@/lib/format";
import { C, NIGHT_GRADIENT, R } from "@/lib/theme";
import { AGE_LABEL, categoryInfo, planOf, priceLevelOf, type EventWithVenue, type Plan, type PriceLevel, type Thermo } from "@/lib/types";
import { T } from "../ui";
import { ThermoBar } from "./thermo";

const openEvent = (id: string) => router.push({ pathname: "/evento/[id]", params: { id } });

export function Cover({ e, style, emojiSize = 44 }: { e: Pick<EventWithVenue, "cover_url" | "category">; style?: StyleProp<ViewStyle>; emojiSize?: number }) {
  const cat = categoryInfo(e.category);
  if (e.cover_url) return <Image source={{ uri: e.cover_url }} style={[{ backgroundColor: C.surface2 }, style as object]} contentFit="cover" transition={150} />;
  return (
    <LinearGradient colors={[`${cat.color}55`, "#1e1e2b", "#11111a"]} start={{ x: 0.2, y: 0 }} end={{ x: 1, y: 1 }} style={[{ alignItems: "center", justifyContent: "center" }, style]}>
      <T size={emojiSize}>{cat.emoji}</T>
    </LinearGradient>
  );
}

export function AgeBadge({ r }: { r: EventWithVenue["age_rating"] }) {
  const bg = r === "18" ? C.danger : r === "16" ? C.warn : C.ok;
  return (
    <View style={{ backgroundColor: bg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
      <T size={11} weight="bold" color={r === "18" ? C.white : "#000"}>{AGE_LABEL[r]}</T>
    </View>
  );
}

export function FeaturedBadge({ plan = "role_da_noite" }: { plan?: Plan }) {
  if (plan === "gratis") return null;
  if (plan === "destaque")
    return (
      <View style={{ backgroundColor: "#000b", borderRadius: R.full, paddingHorizontal: 10, paddingVertical: 4 }}>
        <T size={11} weight="bold" color={C.warn}>🔥 DESTAQUE</T>
      </View>
    );
  return (
    <LinearGradient colors={NIGHT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: R.full, paddingHorizontal: 10, paddingVertical: 4 }}>
      <T size={11} weight="bold" color={C.white}>⭐ ROLÊ DA NOITE</T>
    </LinearGradient>
  );
}

export function PriceLevelBadge({ level, size = 12 }: { level: PriceLevel | null; size?: number }) {
  if (!level) return null;
  return (
    <T size={size} weight="bold">
      <T size={size} weight="bold" color={C.ok}>{"$".repeat(level)}</T>
      <T size={size} weight="bold" color={C.line}>{"$".repeat(3 - level)}</T>
    </T>
  );
}

function LiveBadge() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#000b", borderRadius: R.full, paddingHorizontal: 8, paddingVertical: 4 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.ok }} />
      <T size={11} weight="bold" color={C.ok}>AO VIVO</T>
    </View>
  );
}

export function EventCard({ e, thermo, footer, dim }: { e: EventWithVenue; thermo?: Thermo; footer?: ReactNode; dim?: boolean }) {
  const cat = categoryInfo(e.category);
  const plan = planOf(e);
  const live = isLive(e.starts_at, e.ends_at);
  return (
    <View
      style={{
        backgroundColor: C.surface,
        borderRadius: R.lg,
        borderWidth: 1,
        borderColor: plan === "role_da_noite" ? `${C.accent}99` : plan === "destaque" ? `${C.warn}66` : C.line,
        overflow: "hidden",
        opacity: dim ? 0.6 : 1,
        ...(plan === "role_da_noite" ? { shadowColor: C.accent, shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 6 } : null),
      }}
    >
      <Pressable onPress={() => openEvent(e.id)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        <View>
          <Cover e={e} style={{ height: 160, width: "100%" }} />
          <View style={{ position: "absolute", left: 12, top: 12, flexDirection: "row", gap: 6 }}>
            <FeaturedBadge plan={plan} />
            {live ? <LiveBadge /> : null}
          </View>
          <View style={{ position: "absolute", right: 12, top: 12 }}>
            <AgeBadge r={e.age_rating} />
          </View>
        </View>
        <View style={{ padding: 14, gap: 6 }}>
          <T size={12}>
            <T size={12} weight="semibold" color={cat.color}>{cat.emoji} {cat.label}</T>
            <T size={12} color={C.muted}> · {formatWhen(e.starts_at, e.ends_at)}</T>
          </T>
          <T size={18} weight="display" style={{ lineHeight: 22 }}>{e.title}</T>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <T size={13} color={C.muted} numberOfLines={1} style={{ flex: 1 }}>
              📍 {e.venue?.neighborhood} · {e.venue?.name}
            </T>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <PriceLevelBadge level={priceLevelOf(e)} />
              <T size={13} weight="semibold" color={e.price_cents ? C.ink : C.ok}>{formatPrice(e.price_cents)}</T>
            </View>
          </View>
          {live ? <ThermoBar t={thermo} /> : null}
        </View>
      </Pressable>
      {footer ? <View style={{ borderTopWidth: 1, borderTopColor: `${C.line}99`, paddingHorizontal: 14, paddingVertical: 10 }}>{footer}</View> : null}
    </View>
  );
}

/** Card pequeno do "Bombando agora" */
export function HotCard({ e, thermo }: { e: EventWithVenue; thermo?: Thermo }) {
  return (
    <Pressable onPress={() => openEvent(e.id)} style={{ width: 230, backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, overflow: "hidden" }}>
      <Cover e={e} style={{ height: 96, width: "100%" }} emojiSize={34} />
      <View style={{ padding: 12, gap: 6 }}>
        <T weight="semibold" numberOfLines={1}>{e.title}</T>
        <T size={12} color={C.muted} numberOfLines={1}>📍 {e.venue?.neighborhood}</T>
        <ThermoBar t={thermo} compact />
        {!thermo ? <T size={12} color={C.ok}>● Rolando agora</T> : null}
      </View>
    </Pressable>
  );
}

/** Card grande do carrossel "Rolê da noite" */
export function NightCard({ e }: { e: EventWithVenue }) {
  const cat = categoryInfo(e.category);
  return (
    <Pressable
      onPress={() => openEvent(e.id)}
      style={{ width: 280, height: 220, borderRadius: R.xl, overflow: "hidden", borderWidth: 1, borderColor: `${C.accent}99`, backgroundColor: C.surface }}
    >
      <Cover e={e} style={{ position: "absolute", width: "100%", height: "100%" }} emojiSize={60} />
      <LinearGradient colors={["transparent", "#0000004d", "#000000e6"]} style={{ position: "absolute", width: "100%", height: "100%" }} />
      <View style={{ position: "absolute", left: 12, top: 12 }}>
        <FeaturedBadge />
      </View>
      <View style={{ position: "absolute", right: 12, top: 12 }}>
        <AgeBadge r={e.age_rating} />
      </View>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, gap: 4 }}>
        <T size={12} weight="semibold" color={cat.color}>
          {cat.emoji} {cat.label} · <T size={12} color="#ffffffcc">{formatWhen(e.starts_at, e.ends_at)}</T>
        </T>
        <T size={20} weight="displayBlack" color={C.white} style={{ lineHeight: 23 }} numberOfLines={2}>{e.title}</T>
        <T size={12} color="#ffffffb3" numberOfLines={1}>📍 {e.venue?.neighborhood} · {formatPrice(e.price_cents)}</T>
      </View>
    </Pressable>
  );
}
