import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Flame, MapPin } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { formatWhen, isLive } from "@/lib/format";
import { ART_BG } from "@/lib/illustrations";
import { C, HOLOFOTE_GRADIENT, R } from "@/lib/theme";
import { AGE_LABEL, categoryInfo, eventPrice, planOf, priceLabel, priceLevelOf, type EventWithVenue, type Plan, type PriceLevel, type Thermo } from "@/lib/types";
import { CATEGORY_ICON, CategoryArt, HolofoteIcon, Icon } from "../icons";
import { T } from "../ui";
import { ThermoBar } from "./thermo";

const openEvent = (id: string) => router.push({ pathname: "/evento/[id]", params: { id } });

/** Capa: a foto do evento ou a ilustração da categoria */
export function Cover({ e, style, artSize = 96, artTop = false }: { e: Pick<EventWithVenue, "cover_url" | "category">; style?: StyleProp<ViewStyle>; artSize?: number; artTop?: boolean }) {
  if (e.cover_url) return <Image source={{ uri: e.cover_url }} style={[{ backgroundColor: C.surface2 }, style as object]} contentFit="cover" transition={150} accessibilityIgnoresInvertColors />;
  return (
    <LinearGradient colors={[ART_BG[e.category], "#11111a"]} start={{ x: 0.5, y: 0.2 }} end={{ x: 0.5, y: 1.2 }} style={[{ alignItems: "center", justifyContent: artTop ? "flex-start" : "center", paddingTop: artTop ? 22 : 0 }, style]}>
      <CategoryArt category={e.category} size={artSize} />
    </LinearGradient>
  );
}

/** Categoria com ícone, na cor da categoria */
export function CategoryLabel({ c, size = 12 }: { c: EventWithVenue["category"]; size?: number }) {
  const cat = categoryInfo(c);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Icon icon={CATEGORY_ICON[c]} size={size + 2} color={cat.color} />
      <T size={size} weight="semibold" color={cat.color}>
        {cat.label}
      </T>
    </View>
  );
}

/** Bairro (e local) com o pino */
export function Place({ e, full = true, size = 13, color = C.muted }: { e: EventWithVenue; full?: boolean; size?: number; color?: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 }}>
      <Icon icon={MapPin} size={size + 1} color={color} />
      <T size={size} color={color} numberOfLines={1} style={{ flexShrink: 1 }}>
        {e.venue?.neighborhood}
        {full && e.venue?.name ? ` · ${e.venue.name}` : ""}
      </T>
    </View>
  );
}

export function AgeBadge({ r }: { r: EventWithVenue["age_rating"] }) {
  const bg = r === "18" ? C.danger : r === "16" ? C.warn : C.ok;
  return (
    <View style={{ backgroundColor: bg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }} accessibilityLabel={`Classificação ${AGE_LABEL[r]}`}>
      <T size={11} weight="bold" color={r === "18" ? C.white : "#000"}>{AGE_LABEL[r]}</T>
    </View>
  );
}

export function FeaturedBadge({ plan = "holofote" }: { plan?: Plan }) {
  if (plan === "gratis") return null;
  if (plan === "destaque")
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#000c", borderRadius: R.full, paddingHorizontal: 10, paddingVertical: 4 }}>
        <Icon icon={Flame} size={13} color={C.warn} />
        <T size={11} weight="bold" color={C.warn}>DESTAQUE</T>
      </View>
    );
  return (
    <LinearGradient colors={HOLOFOTE_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: R.full, paddingHorizontal: 10, paddingVertical: 4 }}>
      <HolofoteIcon size={13} color={C.white} />
      <T size={11} weight="bold" color={C.white}>HOLOFOTE</T>
    </LinearGradient>
  );
}

export function PriceLevelBadge({ level, size = 12 }: { level: PriceLevel | null; size?: number }) {
  if (!level) return null;
  return (
    <T size={size} weight="bold" accessibilityLabel={`Faixa de preço ${"$".repeat(level)}`}>
      <T size={size} weight="bold" color={C.ok}>{"$".repeat(level)}</T>
      <T size={size} weight="bold" color={C.line}>{"$".repeat(3 - level)}</T>
    </T>
  );
}

function LiveBadge() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#000c", borderRadius: R.full, paddingHorizontal: 8, paddingVertical: 4 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.ok }} />
      <T size={11} weight="bold" color={C.ok}>AO VIVO</T>
    </View>
  );
}

export function EventCard({ e, thermo, footer, dim, distance }: { e: EventWithVenue; thermo?: Thermo; footer?: ReactNode; dim?: boolean; distance?: string }) {
  const plan = planOf(e);
  const live = isLive(e.starts_at, e.ends_at);
  const free = eventPrice(e).free;
  return (
    <View
      style={{
        backgroundColor: C.surface,
        borderRadius: R.lg,
        borderWidth: 1,
        borderColor: plan === "holofote" ? `${C.accent}99` : plan === "destaque" ? `${C.warn}66` : C.line,
        overflow: "hidden",
        opacity: dim ? 0.6 : 1,
        ...(plan === "holofote" ? { shadowColor: C.accent, shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 6 } : null),
      }}
    >
      <Pressable
        onPress={() => openEvent(e.id)}
        accessibilityRole="button"
        accessibilityLabel={`${e.title}, ${formatWhen(e.starts_at, e.ends_at)}, ${e.venue?.neighborhood ?? ""}, ${priceLabel(e)}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <CategoryLabel c={e.category} />
            <T size={12} color={C.muted}>· {formatWhen(e.starts_at, e.ends_at)}</T>
          </View>
          <T size={18} weight="display" style={{ lineHeight: 22 }}>{e.title}</T>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Place e={e} />
              {distance ? <T size={12} color={C.muted}>· {distance}</T> : null}
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <PriceLevelBadge level={priceLevelOf(e)} />
              <T size={13} weight="semibold" color={free ? C.ok : C.ink}>{priceLabel(e)}</T>
            </View>
          </View>
          {live ? <ThermoBar t={thermo} /> : null}
        </View>
      </Pressable>
      {footer ? <View style={{ borderTopWidth: 1, borderTopColor: `${C.line}99`, paddingHorizontal: 14, paddingVertical: 8 }}>{footer}</View> : null}
    </View>
  );
}

/** Card pequeno do "Bombando agora" */
export function HotCard({ e, thermo }: { e: EventWithVenue; thermo?: Thermo }) {
  return (
    <Pressable onPress={() => openEvent(e.id)} accessibilityRole="button" accessibilityLabel={e.title} style={{ width: 230, backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, overflow: "hidden" }}>
      <Cover e={e} style={{ height: 96, width: "100%" }} artSize={64} />
      <View style={{ padding: 12, gap: 6 }}>
        <T weight="semibold" numberOfLines={1}>{e.title}</T>
        <Place e={e} full={false} size={12} />
        <ThermoBar t={thermo} compact />
        {!thermo ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.ok }} />
            <T size={12} color={C.ok}>Rolando agora</T>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Card grande do carrossel "Em destaque" (eventos com Holofote) */
export function SpotlightCard({ e }: { e: EventWithVenue }) {
  return (
    <Pressable
      onPress={() => openEvent(e.id)}
      accessibilityRole="button"
      accessibilityLabel={`Holofote: ${e.title}, ${formatWhen(e.starts_at, e.ends_at)}`}
      style={{ width: 280, height: 220, borderRadius: R.xl, overflow: "hidden", borderWidth: 1, borderColor: `${C.accent}99`, backgroundColor: C.surface }}
    >
      <Cover e={e} style={{ position: "absolute", width: "100%", height: "100%" }} artSize={92} artTop />
      <LinearGradient colors={["transparent", "#0000004d", "#000000e6"]} style={{ position: "absolute", width: "100%", height: "100%" }} />
      <View style={{ position: "absolute", left: 12, top: 12 }}>
        <FeaturedBadge />
      </View>
      <View style={{ position: "absolute", right: 12, top: 12 }}>
        <AgeBadge r={e.age_rating} />
      </View>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <CategoryLabel c={e.category} />
          <T size={12} color="#ffffffd9">· {formatWhen(e.starts_at, e.ends_at)}</T>
        </View>
        <T size={20} weight="displayBlack" color={C.white} style={{ lineHeight: 23 }} numberOfLines={2}>{e.title}</T>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Place e={e} full={false} size={12} color="#ffffffcc" />
          <T size={12} color="#ffffffcc">· {priceLabel(e)}</T>
        </View>
      </View>
    </Pressable>
  );
}
