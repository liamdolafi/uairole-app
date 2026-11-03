import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import { supabase } from "./supabase";
import type { Payment, PaymentMethod } from "./types";

export type StartBody =
  | { kind: "ingresso"; method: PaymentMethod; eventId: string; items: { type_id: string; qty: number; half?: boolean }[] }
  | { kind: "plano"; method: PaymentMethod; plan: "destaque" | "holofote"; period: "evento" | "mensal"; eventId?: string | null };

/**
 * Começa um pagamento. Pix: abre a tela do QR code no app.
 * Cartão: abre a página segura do Mercado Pago (o cartão é digitado só lá) e volta pro app.
 */
export async function startPayment(body: StartBody): Promise<string | null> {
  const r = await api<{ paymentId: string; checkoutUrl?: string }>("/api/pagamentos", { body: { ...body, fromApp: true } });
  if ("error" in r) return r.error;
  if (r.checkoutUrl) {
    await WebBrowser.openAuthSessionAsync(r.checkoutUrl, `uairole://pagamento/${r.paymentId}`).catch(() => {});
  }
  router.push({ pathname: "/pagamento/[id]", params: { id: r.paymentId } });
  return null;
}

/** Acompanha um pagamento: lê do banco a cada 4 s e pergunta ao Mercado Pago a cada 12 s */
export function usePayment(id: string) {
  const [payment, setPayment] = useState<Payment | null | undefined>(undefined);
  const ticks = useRef(0);

  const load = useCallback(async () => {
    const { data } = await supabase.from("payments").select("*").eq("id", id).maybeSingle();
    setPayment((data as Payment) ?? null);
    return data as Payment | null;
  }, [id]);

  const verify = useCallback(async () => {
    await api(`/api/pagamentos/${id}/verificar`);
    return load();
  }, [id, load]);

  useEffect(() => {
    let stop = false;
    verify();
    const t = setInterval(async () => {
      if (stop) return;
      ticks.current++;
      const p = ticks.current % 3 === 0 ? await verify() : await load();
      if (p && p.status !== "pendente") clearInterval(t);
    }, 4000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [load, verify]);

  return { payment, reload: load, verify };
}

/** Só no modo de teste: finge que o Pix foi pago */
export async function simulatePayment(id: string) {
  const r = await api(`/api/pagamentos/${id}/simular`);
  return "error" in (r as object) ? (r as { error: string }).error : null;
}
