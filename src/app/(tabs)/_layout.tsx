import { Tabs } from "expo-router/js-tabs";
import type { LucideIcon } from "lucide-react-native";
import { Compass, Heart, LayoutDashboard, Map, MessageCircle, User } from "lucide-react-native";
import { ActivityIndicator, View, type ColorValue } from "react-native";
import { useAuth } from "@/components/auth-provider";
import { Icon } from "@/components/icons";
import { C, F } from "@/lib/theme";

function icon(I: LucideIcon) {
  return function TabIcon({ color, focused }: { color: ColorValue; focused: boolean; size: number }) {
    // mesmo traço em todos; a aba ativa ganha cor de destaque
    return <Icon icon={I} size={22} color={color as string} fill={focused && I === Heart ? (color as string) : "none"} />;
  };
}

export default function TabsLayout() {
  // sessão e tipo do usuário carregam juntos na abertura: um carregamento rápido em vez de piscar a barra
  const { loading } = useAuth();
  if (loading)
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }} accessibilityLabel="Carregando">
        <ActivityIndicator color={C.accent} />
      </View>
    );
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { backgroundColor: "#0b0b12f2", borderTopColor: C.line },
        tabBarLabelStyle: { fontFamily: F.semibold, fontSize: 10 },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Descobrir", tabBarIcon: icon(Compass) }} />
      <Tabs.Screen name="mapa" options={{ title: "Mapa", tabBarIcon: icon(Map) }} />
      <Tabs.Screen name="feed" options={{ title: "Feed", tabBarIcon: icon(MessageCircle) }} />
      <Tabs.Screen name="favoritos" options={{ title: "Favoritos", tabBarIcon: icon(Heart) }} />
      <Tabs.Screen name="painel" options={{ title: "Painel", tabBarIcon: icon(LayoutDashboard) }} />
      <Tabs.Screen name="perfil" options={{ title: "Perfil", tabBarIcon: icon(User) }} />
    </Tabs>
  );
}
