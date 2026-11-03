import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { ART_BG } from "@/lib/illustrations";
import { C } from "@/lib/theme";
import type { Category, Plan } from "@/lib/types";
import { CategoryArt } from "../icons";
import { T } from "../ui";

export const BH_REGION = { latitude: -19.9227, longitude: -43.9451, latitudeDelta: 0.09, longitudeDelta: 0.09 };

/** Pino em gota com a ilustração da categoria (igual ao site). Holofote é maior e com brilho. */
export function Pin({ category, plan = "gratis" }: { category: Category; plan?: Plan }) {
  const size = plan === "holofote" ? 54 : plan === "destaque" ? 46 : 40;
  const glow = plan === "holofote";
  const shape = {
    width: size,
    height: size,
    borderTopLeftRadius: size / 2,
    borderTopRightRadius: size / 2,
    borderBottomRightRadius: size / 2,
    borderBottomLeftRadius: 0,
    transform: [{ rotate: "-45deg" }],
    padding: 3,
  };
  const inner = (
    <View style={{ flex: 1, borderRadius: size, backgroundColor: ART_BG[category], alignItems: "center", justifyContent: "center", overflow: "hidden", transform: [{ rotate: "45deg" }] }}>
      <CategoryArt category={category} size={Math.round(size * 0.78)} />
    </View>
  );
  return (
    <View style={{ padding: 8, ...(glow ? { shadowColor: C.accent, shadowOpacity: 0.9, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } } : null) }}>
      {glow ? (
        <LinearGradient colors={[C.accent, C.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={shape}>
          {inner}
        </LinearGradient>
      ) : (
        <View style={[shape, { backgroundColor: plan === "destaque" ? C.warn : C.white }]}>{inner}</View>
      )}
    </View>
  );
}

/** Grupo de pinos próximos (abre ao dar zoom) */
export function ClusterPin({ count, hot }: { count: number; hot: boolean }) {
  const size = count < 10 ? 46 : count < 50 ? 54 : 62;
  return (
    <View style={{ padding: 6 }}>
      <View style={{ width: size + 12, height: size + 12, borderRadius: size, backgroundColor: `${C.accent}40`, alignItems: "center", justifyContent: "center" }}>
        <LinearGradient
          colors={hot ? [C.accentStrong, C.orangeStrong] : [C.accentStrong, C.accentStrong]}
          style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderColor: C.white, alignItems: "center", justifyContent: "center" }}
        >
          <T size={count < 100 ? 16 : 14} weight="bold" color={C.white}>
            {count}
          </T>
        </LinearGradient>
      </View>
    </View>
  );
}
