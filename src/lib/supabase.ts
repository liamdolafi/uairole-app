import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import aesjs from "aes-js";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { AppState, Platform } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const hasSupabaseEnv = Boolean(url && key);

/**
 * Sessão salva com segurança:
 * a sessão é criptografada (AES-256) e guardada no AsyncStorage; a chave da
 * criptografia fica no cofre do celular (Keychain no iPhone, Keystore no Android).
 * Assim não esbarra no limite de tamanho do SecureStore.
 */
class SecureSessionStorage {
  private async encrypt(storageKey: string, value: string) {
    const encryptionKey = Crypto.getRandomBytes(32);
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encrypted = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await SecureStore.setItemAsync(storageKey, aesjs.utils.hex.fromBytes(encryptionKey));
    return aesjs.utils.hex.fromBytes(encrypted);
  }

  private async decrypt(storageKey: string, value: string) {
    const hexKey = await SecureStore.getItemAsync(storageKey);
    if (!hexKey) return null;
    const cipher = new aesjs.ModeOfOperation.ctr(aesjs.utils.hex.toBytes(hexKey), new aesjs.Counter(1));
    return aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(value)));
  }

  async getItem(k: string) {
    const enc = await AsyncStorage.getItem(k);
    if (!enc) return null;
    try {
      return await this.decrypt(k, enc);
    } catch {
      return null;
    }
  }

  async setItem(k: string, value: string) {
    const enc = await this.encrypt(k, value);
    await AsyncStorage.setItem(k, enc);
  }

  async removeItem(k: string) {
    await AsyncStorage.removeItem(k);
    await SecureStore.deleteItemAsync(k);
  }
}

export const supabase = createClient(url ?? "https://faltando.supabase.co", key ?? "faltando", {
  auth: {
    storage: Platform.OS === "web" ? undefined : new SecureSessionStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Renova a sessão só com o app aberto
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
