import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { supabase } from "./supabase";
import { DEFAULT_APP_CONFIG, DEFAULT_PLAN_INFO, type AppConfig, type PlanInfo } from "./types";

/** Configuração pública (taxa dos ingressos e se dá pra comprar planos dentro do app) */
export function useAppConfig() {
  const [cfg, setCfg] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [info, setInfo] = useState<PlanInfo>(DEFAULT_PLAN_INFO);
  useEffect(() => {
    supabase.rpc("app_config").then(({ data }) => data && setCfg({ ...DEFAULT_APP_CONFIG, ...(data as Partial<AppConfig>) }));
    supabase.rpc("public_plan_info").then(({ data }) => data && setInfo({ ...DEFAULT_PLAN_INFO, ...(data as Partial<PlanInfo>) }));
  }, []);
  // Regras das lojas (REGRAS_DAS_LOJAS.md): compra de plano no app só se o admin liberou pra esta plataforma
  const planPurchase = Platform.OS === "ios" ? cfg.plan_purchase_ios : Platform.OS === "android" ? cfg.plan_purchase_android : false;
  return { cfg, info, planPurchase };
}
