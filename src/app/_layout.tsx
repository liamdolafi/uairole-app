import { BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold } from "@expo-google-fonts/bricolage-grotesque";
import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold, useFonts } from "@expo-google-fonts/geist";
import { DarkTheme, SplashScreen, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/components/auth-provider";
import { BirthDateGate } from "@/components/birth-date-gate";
import { PushListener } from "@/components/push-listener";
import { ErrorBox, Screen } from "@/components/ui";
import { hasSupabaseEnv } from "@/lib/supabase";
import { C, F } from "@/lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: C.bg, card: C.bg, text: C.ink, border: C.line, primary: C.accent },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
  });
  const ready = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  return (
    <SafeAreaProvider>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        {!hasSupabaseEnv ? (
          <Screen>
            <ErrorBox message="Faltam as chaves do Supabase no arquivo .env (EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY). Depois reinicia com npx expo start -c." />
          </Screen>
        ) : (
          <AuthProvider>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: C.bg },
                headerTintColor: C.ink,
                headerTitleStyle: { fontFamily: F.display, fontSize: 18 },
                headerShadowVisible: false,
                headerBackButtonDisplayMode: "minimal",
                contentStyle: { backgroundColor: C.bg },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="evento/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="local/[id]" options={{ title: "Local" }} />
              <Stack.Screen name="organizador/[id]" options={{ title: "Organizador" }} />
              <Stack.Screen name="pessoa/[id]" options={{ title: "Perfil" }} />
              <Stack.Screen name="post/[id]" options={{ title: "Post" }} />
              <Stack.Screen name="entrar" options={{ title: "", presentation: "modal" }} />
              <Stack.Screen name="cadastro" options={{ title: "", presentation: "modal" }} />
              <Stack.Screen name="verificar" options={{ title: "" }} />
              <Stack.Screen name="recuperar-senha" options={{ title: "" }} />
              <Stack.Screen name="nova-senha" options={{ title: "", gestureEnabled: false }} />
              <Stack.Screen name="amigos" options={{ title: "Amigos" }} />
              <Stack.Screen name="privacidade" options={{ title: "Privacidade e avisos" }} />
              <Stack.Screen name="avisos" options={{ title: "Avisos" }} />
              <Stack.Screen name="+not-found" options={{ title: "Ops" }} />
            </Stack>
            <BirthDateGate />
            <PushListener />
          </AuthProvider>
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
