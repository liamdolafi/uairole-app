import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { categoryInfo, type Category, type Plan } from "@/lib/types";
import { C } from "@/lib/theme";
import { T } from "../ui";

export const BH_REGION = { latitude: -19.9227, longitude: -43.9451, latitudeDelta: 0.09, longitudeDelta: 0.09 };

/** Pino em gota com o emoji da categoria (igual ao site). Rolê da noite é maior e com brilho. */
export function Pin({ category, plan = "gratis" }: { category: Category; plan?: Plan }) {
  const info = categoryInfo(category);
  const size = plan === "role_da_noite" ? 50 : plan === "destaque" ? 42 : 36;
  const glow = plan === "role_da_noite";
  const shape = {
    width: size,
    height: size,
    borderTopLeftRadius: size / 2,
    borderTopRightRadius: size / 2,
    borderBottomRightRadius: size / 2,
    borderBottomLeftRadius: 0,
    transform: [{ rotate: "-45deg" }],
    borderWidth: glow ? 3 : 2,
    borderColor: C.white,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    overflow: "hidden" as const,
  };
  const inner = (
    <View style={{ transform: [{ rotate: "45deg" }] }}>
      <T size={Math.round(size * 0.45)}>{info.emoji}</T>
    </View>
  );
  return (
    <View style={{ padding: 8, ...(glow ? { shadowColor: C.accent, shadowOpacity: 0.9, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } } : null) }}>
      {glow ? (
        <LinearGradient colors={[C.accent, C.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={shape}>
          {inner}
        </LinearGradient>
      ) : (
        <View style={[shape, { backgroundColor: info.color }]}>{inner}</View>
      )}
    </View>
  );
}
