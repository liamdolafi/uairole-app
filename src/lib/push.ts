import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { supabase } from "./supabase";

type NotificationsModule = typeof import("expo-notifications");

const TOKEN_KEY = "uairole-push-token";

/** No Expo Go do Android o push remoto não existe (precisa do app de teste/development build). */
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let mod: NotificationsModule | null | undefined;
/** Carrega o expo-notifications só quando dá (no Expo Go do Android ele reclama só de importar). */
export function notifications(): NotificationsModule | null {
  if (mod !== undefined) return mod;
  if (Platform.OS === "web" || (isExpoGo && Platform.OS === "android")) return (mod = null);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require("expo-notifications") as NotificationsModule;
    mod.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
    });
  } catch {
    mod = null;
  }
  return mod;
}

function projectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

export async function savedToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

/** Pede permissão, pega o token deste celular e salva no banco. */
export async function enablePush(): Promise<{ ok: true } | { error: string }> {
  const N = notifications();
  if (!N || isExpoGo)
    return { error: "As notificações chegam na versão do app instalada pela loja. Nesta versão de teste elas ficam desligadas." };
  if (!Device.isDevice) return { error: "Notificação push só funciona num celular de verdade, não no simulador." };
  const id = projectId();
  if (!id) return { error: "Falta ligar o projeto na Expo (eas init) pra ativar as notificações." };

  if (Platform.OS === "android") {
    await N.setNotificationChannelAsync("default", {
      name: "Avisos do Uai Rolê",
      importance: N.AndroidImportance.HIGH,
      lightColor: "#ff2e88",
    });
  }
  let { status } = await N.getPermissionsAsync();
  if (status !== "granted") status = (await N.requestPermissionsAsync()).status;
  if (status !== "granted") return { error: "Você não deu permissão pra notificações. Dá pra liberar nas configurações do celular." };

  try {
    const { data: token } = await N.getExpoPushTokenAsync({ projectId: id });
    const { error } = await supabase.rpc("save_device_token", { p_token: token, p_platform: Platform.OS });
    if (error) {
      if (/save_device_token/i.test(error.message)) return { error: "O banco ainda não tem a tabela de aparelhos (falta rodar o 023_app_push.sql)." };
      return { error: error.message };
    }
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não deu pra ativar as notificações." };
  }
}

/** Para de receber neste celular (também chamado ao sair da conta). */
export async function disablePush() {
  const token = await savedToken();
  if (!token) return;
  await supabase.from("device_push_tokens").delete().eq("token", token);
  await AsyncStorage.removeItem(TOKEN_KEY);
}

/** Se já estava ligado, renova o token salvo (ele pode mudar). */
export async function refreshPushToken() {
  const N = notifications();
  if (!N || isExpoGo || !(await savedToken())) return;
  const { status } = await N.getPermissionsAsync();
  if (status !== "granted") return;
  await enablePush();
}
