import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { REF_CODE_RE } from "./types";

// Indicação (033), igual ao site: quem abre um link com ?ref= guarda o código por 7 dias.
// Se criar a conta nesse tempo, a conta nova conta como indicação de quem compartilhou.
const KEY = "uairole-ref";
const TTL = 7 * 86400000;

export async function rememberRef(code: string) {
  if (!REF_CODE_RE.test(code)) return;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ code, at: Date.now() }));
  } catch {}
}

async function pendingRef(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const { code, at } = JSON.parse(raw) as { code: string; at: number };
    if (!REF_CODE_RE.test(code) || Date.now() - at > TTL) {
      await AsyncStorage.removeItem(KEY);
      return null;
    }
    return code;
  } catch {
    return null;
  }
}

/** Depois do login: se veio de um link de indicação, registra (o banco só aceita conta criada há pouco) */
export async function claimPendingRef() {
  const code = await pendingRef();
  if (!code) return;
  const { error } = await supabase.rpc("claim_referral", { p_code: code });
  if (!error) await AsyncStorage.removeItem(KEY).catch(() => {});
}

/** Código de indicação de quem está logado (vai nos links de compartilhar) */
export function useMyRefCode(enabled: boolean) {
  const [code, setCode] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    supabase.rpc("my_referral_code").then(({ data }) => alive && setCode(typeof data === "string" ? data : null));
    return () => {
      alive = false;
    };
  }, [enabled]);
  return enabled ? code : null;
}

/** Quem chamou? (só o primeiro nome; menor de 18 vem sem nome) */
export function useInviter(code: string | null) {
  const [inviter, setInviter] = useState<{ first_name: string | null } | null>(null);
  useEffect(() => {
    if (!code || !REF_CODE_RE.test(code)) return;
    let alive = true;
    supabase
      .rpc("referral_inviter", { p_code: code })
      .then(({ data, error }) => alive && setInviter(error || !data ? null : (data as { first_name: string | null })));
    return () => {
      alive = false;
    };
  }, [code]);
  return code ? inviter : null;
}

/** Quantas pessoas a pessoa trouxe pro Uai Rolê */
export function useMyReferralCount(enabled: boolean) {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    if (!enabled) return;
    supabase.rpc("my_referral_count").then(({ data, error }) => setN(error ? null : Number(data ?? 0)));
  }, [enabled]);
  return n;
}
