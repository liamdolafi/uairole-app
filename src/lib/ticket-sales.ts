import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { openSite } from "./site";
import { supabase } from "./supabase";
import type { Plan, TicketSalesStatus } from "./types";

/**
 * Pode vender ingressos pelo Uai Rolê? (030: só com Destaque ou Holofote valendo). Igual ao site.
 * Sem evento = evento novo (vale o plano mensal). Se o 030 ainda não rodou, adivinha pelo plano.
 */
export function useTicketSalesStatus(eventId: string | null, enabled: boolean, guess: { eventPlan?: Plan; orgPlan?: Plan }) {
  const [st, setSt] = useState<TicketSalesStatus | null>(null);
  const { eventPlan, orgPlan } = guess;
  const load = useCallback(async () => {
    if (!enabled) return;
    const { data, error } = await supabase.rpc("ticket_sales_status", eventId ? { p_event: eventId } : {});
    if (!error && data) return setSt(data as TicketSalesStatus);
    const plan: Plan = eventPlan && eventPlan !== "gratis" ? eventPlan : (orgPlan ?? "gratis");
    setSt({ allowed: plan !== "gratis", plan, legacy: false, sells: false, paused: false, until: null });
  }, [eventId, enabled, eventPlan, orgPlan]);
  useEffect(() => {
    load();
  }, [load]);
  return { status: st, reload: load };
}

/** Renovar/ativar o plano de um evento: no app (se o admin liberou) ou na página de pagamento do site */
export function openRenew(eventId: string | null | undefined, planPurchase: boolean, plan: Plan = "destaque") {
  const p = plan === "gratis" ? "destaque" : plan;
  const periodo = eventId ? "evento" : "mensal";
  if (planPurchase) return router.push({ pathname: "/painel/assinar", params: { plano: p, periodo, ...(eventId ? { evento: eventId } : {}) } });
  return openSite(`/planos/assinar?plano=${p}&periodo=${periodo}${eventId ? `&evento=${eventId}` : ""}`);
}
