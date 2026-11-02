import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router/js-tabs";
import type { ColorValue } from "react-native";
import { C, F } from "@/lib/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function icon(on: IconName, off: IconName) {
  return function TabIcon({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) {
    return <Ionicons name={focused ? on : off} color={color as string} size={size} />;
  };
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { backgroundColor: "#0b0b12f2", borderTopColor: C.line },
        tabBarLabelStyle: { fontFamily: F.semibold, fontSize: 11 },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Descobrir", tabBarIcon: icon("compass", "compass-outline") }} />
      <Tabs.Screen name="mapa" options={{ title: "Mapa", tabBarIcon: icon("map", "map-outline") }} />
      <Tabs.Screen name="feed" options={{ title: "Feed", tabBarIcon: icon("chatbubbles", "chatbubbles-outline") }} />
      <Tabs.Screen name="favoritos" options={{ title: "Favoritos", tabBarIcon: icon("heart", "heart-outline") }} />
      <Tabs.Screen name="perfil" options={{ title: "Perfil", tabBarIcon: icon("person-circle", "person-circle-outline") }} />
    </Tabs>
  );
}
