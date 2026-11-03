// Filtros salvos no aparelho (AsyncStorage) e compartilhados entre Descobrir e Mapa.
// A localização NÃO é salva: fica só na memória enquanto o app está aberto.
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { DEFAULT_FILTERS, sanitizeFilters, type Filters } from "./filters";

const KEY = "uairole:filtros:v1";
const listeners = new Set<() => void>();
let current: Filters = { ...DEFAULT_FILTERS };
let loaded = false;

function emit() {
  listeners.forEach((l) => l());
}

async function loadOnce() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      current = sanitizeFilters(JSON.parse(raw));
      emit();
    }
  } catch {
    // sem nada salvo: segue com o padrão
  }
}

function write(f: Filters) {
  current = f;
  emit();
  AsyncStorage.setItem(KEY, JSON.stringify(f)).catch(() => {});
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export function useFilters() {
  useEffect(() => {
    loadOnce();
  }, []);
  const filters = useSyncExternalStore(subscribe, () => current);
  const setFilters = useCallback((next: Filters | ((f: Filters) => Filters)) => {
    write(sanitizeFilters(typeof next === "function" ? next(current) : next));
  }, []);
  const clear = useCallback(() => write({ ...DEFAULT_FILTERS, sort: current.sort }), []);
  return { filters, setFilters, clear };
}

// ===== Localização só na memória =====
type Pos = { lat: number; lng: number } | null;
let pos: Pos = null;
const posListeners = new Set<() => void>();

/** Pede a localização (só quando a pessoa toca), sem guardar nada */
export async function locateNow(): Promise<Pos> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) throw new Error("Sem permissão de localização. Dá pra liberar nos Ajustes do celular.");
  const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  pos = { lat: p.coords.latitude, lng: p.coords.longitude };
  posListeners.forEach((l) => l());
  return pos;
}

export function useHere() {
  return useSyncExternalStore(
    (l) => {
      posListeners.add(l);
      return () => {
        posListeners.delete(l);
      };
    },
    () => pos,
  );
}
