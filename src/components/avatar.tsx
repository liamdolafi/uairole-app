import { Image } from "expo-image";
import { View } from "react-native";
import { C } from "@/lib/theme";
import { T } from "./ui";

const COLORS = ["#ff2e88", "#a855f7", "#22c55e", "#06b6d4", "#f59e0b", "#f97316"];

export function Avatar({ name, url, size = 36 }: { name: string; url?: string | null; size?: number }) {
  if (url) {
    return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: C.line }} contentFit="cover" />;
  }
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
  const color = COLORS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % COLORS.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}33`, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: `${color}66` }}>
      <T size={size * 0.38} weight="bold" color={color}>{initials}</T>
    </View>
  );
}
